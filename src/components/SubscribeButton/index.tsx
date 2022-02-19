import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import { getStripeJs } from '../../services/stripe-js';
import styles from './styles.module.scss';

interface SubscribeButtonProps {
  priceId: string;
}

const SubscribeButton = ({ priceId }:SubscribeButtonProps) => {

  const { data: session } = useSession();
  const router = useRouter()

  const handleSubscribe = async () => {
    if(!session) {
      signIn('github');
      return;
    }

    if(session.activeSubscription) {

      router.push('/posts');
      return;
    }

    // cria o checkoutsession
    try {
      const response = await api.post('/subscribe');

      const { sessionId } = response.data;

      const stripe = await getStripeJs()
      await stripe.redirectToCheckout({ sessionId });
    }catch (err) {
      alert(err.message);
    }
  }

  return (
    <button
      type='button'
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe Now
    </button>
  )
} 

export {SubscribeButton}