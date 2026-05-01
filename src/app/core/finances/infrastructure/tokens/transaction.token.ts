import { InjectionToken } from '@angular/core';
import { TransactionPort } from '../../domain/ports/transaction.port';

/** Token DI para inyectar el adaptador de transacciones (MockTransactionAdapter o JavaTransactionAdapter) */
export const TRANSACTION_PORT = new InjectionToken<TransactionPort>('TRANSACTION_PORT');
