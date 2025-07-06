// Utilidad para obtener la descripción de la forma de pago a partir del código
import { PAYMENT_METHODS } from '../paymentMethods';

export function getPaymentMethodDescription(code: string): string {
  const found = PAYMENT_METHODS.find(pm => pm.FPago === code);
  return found ? found.DescripcionFpago : code;
}
