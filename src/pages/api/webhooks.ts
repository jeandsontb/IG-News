/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from 'stream';
import Stripe from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

async function buffer(readable: Readable) {
  const chuncks = [];

  for await (const chunck of readable) {
    chuncks.push(
      typeof chunck === 'string' ? Buffer.from(chunck) : chunck
    );
  }

  return Buffer.concat(chuncks);
}

export const config = {
  api: {
    bodyParser: false
  }
}

const relevantsEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
])

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if(req.method === 'POST') {
    const buf = await buffer(req);
    const secret = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEB_HOOK_SECRET);

    } catch (err) {
      return res.status(400).send(`Webhook error: ${err.message}`);
    }

    const { type } = event;

    if(relevantsEvents.has(type)) {
      // console.log('Evento recebido ', event);
      try {
        switch (type) {
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':

            const subscription = event.data.object as Stripe.Subscription;

            await saveSubscription(
              subscription.id,
              subscription.customer.toString(),
              false
            )

          break;
          case 'checkout.session.completed':

          const checkoutSession = event.data.object as Stripe.Checkout.Session;

          await saveSubscription(
            checkoutSession.subscription.toString(),
            checkoutSession.customer.toString(),
            true
          )
  
          break;
          default:
            throw new Error('Unhandled event.')
        }
      } catch (err) {
        return res.json({ error: 'Webhook handler failed.' })
      }
    }

    res.json({received: true});
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
  }
}