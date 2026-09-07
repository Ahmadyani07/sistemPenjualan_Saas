import { MetodePembayaran } from "@/types";
import { PAYMENT_METHODS } from "./payment";

export function getMethodLabel(method: MetodePembayaran): string {
  const found = PAYMENT_METHODS.find((m) => m.id === method);
  if (found) return found.label;
  return method;
}

export function getMethodGroupLabel(method: MetodePembayaran): string {
  const found = PAYMENT_METHODS.find((m) => m.id === method);
  return found?.groupLabel || method;
}

export function getPaymentChannelName(method: MetodePembayaran, pembayaranDetail?: { channel?: string }): string {
  if (pembayaranDetail?.channel) return pembayaranDetail.channel;
  return getMethodLabel(method);
}
