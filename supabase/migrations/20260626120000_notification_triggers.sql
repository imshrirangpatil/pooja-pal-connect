-- Fire in-app notifications on real events so the feed is populated:
--   User: order placed, booking confirmed, order shipped/delivered, payment received.
--   Admin: new order, new pandit application, new support ticket.
-- All functions are SECURITY DEFINER and insert directly into notifications so they
-- work regardless of the acting user's table privileges.

CREATE OR REPLACE FUNCTION public.notify_admins(_type text, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (r.user_id, _type, _title, _body, _link);
  END LOOP;
END; $$;

-- New order: thank the buyer, alert admins.
CREATE OR REPLACE FUNCTION public.notify_on_order_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.user_id, 'order', 'Order received',
          'Thank you. We have your order and will confirm it shortly.', '/orders');
  PERFORM public.notify_admins('order', 'New order',
          'New order from ' || COALESCE(NEW.recipient_name, 'a customer') ||
          ' for Rs ' || NEW.total::text, '/admin/orders');
  RETURN NEW;
END; $$;

CREATE TRIGGER orders_notify_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_insert();

-- Order updates: status changes and payment received.
CREATE OR REPLACE FUNCTION public.notify_on_order_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Booking confirmed', 'Your booking is confirmed. A pandit will be in touch.', '/bookings');
    ELSIF NEW.status = 'shipped' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order shipped', 'Your samagri is on the way.', '/orders');
    ELSIF NEW.status IN ('delivered', 'completed') THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'order', 'Order complete', 'Your order is complete. Pranam from all of us.', '/orders');
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

CREATE TRIGGER orders_notify_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_order_update();

-- New pandit application -> admins.
CREATE OR REPLACE FUNCTION public.notify_on_application_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('application', 'New pandit application',
          COALESCE(NEW.full_name, 'Someone') || ' applied to join as a pandit.', '/admin/applications');
  RETURN NEW;
END; $$;

CREATE TRIGGER applications_notify_insert
  AFTER INSERT ON public.pandit_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_insert();

-- New support ticket -> admins.
CREATE OR REPLACE FUNCTION public.notify_on_ticket_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_admins('ticket', 'New support ticket',
          COALESCE(NEW.subject, 'A new ticket needs attention'), '/admin/tickets');
  RETURN NEW;
END; $$;

CREATE TRIGGER tickets_notify_insert
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_insert();
