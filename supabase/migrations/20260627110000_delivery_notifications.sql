-- Extend order-status notifications with the "out for delivery" step, and tell
-- pandit applicants when their application is approved or rejected.
-- CREATE OR REPLACE makes this safe to re-run.

CREATE OR REPLACE FUNCTION public.notify_on_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order confirmed', 'Your order is confirmed and being packed.', '/orders');
    ELSIF NEW.status = 'shipped' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order shipped', 'Your samagri is on the way.', '/orders');
    ELSIF NEW.status = 'out_for_delivery' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Out for delivery', 'Your order is out for delivery and arrives soon.', '/orders');
    ELSIF NEW.status IN ('delivered', 'completed') THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order delivered', 'Your order is delivered. Pranam from all of us.', '/orders');
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order cancelled', 'Your order was cancelled. Reach support if this is unexpected.', '/orders');
    END IF;
  END IF;

  IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'payment', 'Payment received', 'We have received your payment. Thank you.', '/orders');
  END IF;

  RETURN NEW;
END; $$;

-- Tell a pandit applicant the outcome of their application.
CREATE OR REPLACE FUNCTION public.notify_on_application_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'application', 'Application approved',
              'Welcome aboard. Your pandit profile is now live on Pranam.', '/pandit');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'application', 'Application update',
              'We could not approve your application this time. Our team will reach out with details.', '/');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_notify_update ON public.pandit_applications;
CREATE TRIGGER applications_notify_update
  AFTER UPDATE ON public.pandit_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_update();
