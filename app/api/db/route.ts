/**
 * Database API Route Handler
 * 
 * This route handles all database operations via HTTP API.
 * In a future Electron integration, these operations would be handled
 * via IPC instead.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as queries from '@/lib/sqlite/queries';

export async function POST(request: NextRequest) {
  try {
    const { action, params } = await request.json();

    let result: any;

    switch (action) {
      // Users
      case 'getUserByEmail':
        result = queries.getUserByEmail(params.email);
        break;
      case 'getFirstUser':
        result = queries.getFirstUser();
        break;
      case 'createUser':
        result = queries.createUser(params.email, params.passwordHash, params.recoveryCodeHash);
        break;
      case 'resetPassword':
        result = queries.resetPassword(params.email, params.newPasswordHash);
        break;
      case 'updateUser':
        result = queries.updateUser(params.userId, params.updates);
        break;
      case 'getUserCount':
        result = queries.getUserCount();
        break;

      // Companies
      case 'getCompanies':
        result = queries.getCompanies(params.userId);
        break;
      case 'addCompany':
        result = queries.addCompany(params.userId, params.company);
        break;
      case 'updateCompany':
        result = queries.updateCompany(params.companyId, params.updates);
        break;
      case 'deleteCompany':
        queries.deleteCompany(params.companyId);
        result = { success: true };
        break;

      // Fournisseurs
      case 'getFournisseurs':
        result = queries.getFournisseurs(params.userId);
        break;
      case 'addFournisseur':
        result = queries.addFournisseur(params.userId, params.fournisseur);
        break;
      case 'updateFournisseur':
        result = queries.updateFournisseur(params.fournisseurId, params.updates);
        break;
      case 'deleteFournisseur':
        queries.deleteFournisseur(params.fournisseurId);
        result = { success: true };
        break;

      // Transactions
      case 'getTransactions':
        result = queries.getTransactions(params.userId);
        break;
      case 'addTransaction':
        result = queries.addTransaction(params.userId, params.transaction);
        break;
      case 'updateTransaction':
        result = queries.updateTransaction(params.transactionId, params.updates);
        break;
      case 'deleteTransaction':
        queries.deleteTransaction(params.transactionId);
        result = { success: true };
        break;

      // Fund Capital
      case 'getFundCapital':
        result = queries.getFundCapital(params.userId);
        break;
      case 'setFundCapital':
        result = queries.setFundCapital(params.userId, params.amount, params.passwordHash, params.recordTransaction);
        break;
      case 'getFundTransactions':
        result = queries.getFundTransactions(params.userId);
        break;
      case 'addFundTransaction':
        result = queries.addFundTransaction(params.userId, params.transaction, params.updateBalance);
        break;

      // Currency Companies
      case 'getCurrencyCompanies':
        result = queries.getCurrencyCompanies(params.userId);
        break;
      case 'addCurrencyCompany':
        result = queries.addCurrencyCompany(params.userId, params.company);
        break;
      case 'updateCurrencyCompany':
        result = queries.updateCurrencyCompany(params.companyId, params.updates);
        break;
      case 'deleteCurrencyCompany':
        queries.deleteCurrencyCompany(params.companyId);
        result = { success: true };
        break;

      // Currency Transactions
      case 'getCurrencyTransactions':
        result = queries.getCurrencyTransactions(params.userId);
        break;
      case 'addCurrencyTransaction':
        result = queries.addCurrencyTransaction(params.userId, params.transaction);
        break;
      case 'updateCurrencyTransaction':
        result = queries.updateCurrencyTransaction(params.transactionId, params.updates);
        break;
      case 'deleteCurrencyTransaction':
        queries.deleteCurrencyTransaction(params.transactionId);
        result = { success: true };
        break;

      // Trash (سلة المهملات)
      case 'getTrashItems':
        result = queries.getTrashItems(params.userId);
        break;
      case 'addToTrash':
        result = queries.addTrashItem(params.userId, params.itemType, params.itemData);
        break;
      case 'removeFromTrash':
        queries.removeTrashItem(params.trashId);
        result = { success: true };
        break;

      case 'resetUserDatabase':
        queries.resetUserDatabase(params.userId);
        result = { success: true };
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Trigger Auto-Backup for write operations
    if (!action.startsWith('get')) {
      // Fire and forget - don't await strictly for response speed, 
      // but since Next.js serverless might kill it, we better await or use edge runtime.
      // In local 'npm run dev' it works fine async.
      import('@/lib/backup-service').then(service => {
        service.performAutoBackup().catch(e => console.error(e));
      });
    }

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error(`[API] Error in ${request.nextUrl.pathname}:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
