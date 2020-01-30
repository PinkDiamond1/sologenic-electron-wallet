import {
  fork,
  take,
  call,
  put,
  cancel,
  race,
  takeEvery,
  takeLatest,
  all
} from 'redux-saga/effects';

import {
  testingSaga,
  addNewWallet,
  fillNewWallet,
  connectToRippleApi,
  getBalance,
  setConnection,
  getBalanceSuccess,
  getMarketData,
  getMarketDataSuccess,
  getMarketDataError,
  getMarketSevens,
  getMarketSevensSuccess,
  getTransactions,
  getTransactionsSuccess,
  getTransactionsError,
  createTrustlineRequest,
  createTrustlineSuccess,
  createTrustlineError,
  transferXRP,
  transferXrpSuccess,
  transferSOLO,
  transferSoloSuccess,
  getSoloPrice,
  fillSoloPrice,
  fetchRippleFee,
  fillRippleFee
} from '../actions/index';
import { createSevensObj, sologenic } from '../utils/utils2.js';
import configVars from '../utils/config';
import { create } from 'apisauce';

const api = create({
  baseURL: 'https://api.coinfield.com/v1/',
  headers: {
    post: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  timeout: 10000
});

const ops = create({
  baseURL: 'https://ops.coinfield.com',
  headers: {
    post: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  timeout: 10000
});

const mediatorApi = create({
  baseURL: 'https://mediator.coinfield.com/',
  headers: {
    post: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  timeout: 10000
});

const getMarketSevensApi = () => mediatorApi.get('seven');

// TESTING SAGA
function* testingSagaSaga() {
  yield takeLatest(`${testingSaga}`, testingCall);
}

function* testingCall() {
  try {
    console.log('HELLO, SAGA READY!!!!');
  } catch (e) {
    console.log('EEEE');
  }
}

// FETCH RIPPLE FEE
function* fetchRippleFeeSaga() {
  yield takeLatest(`${fetchRippleFee}`, fetchRippleFeeCall);
}

function* fetchRippleFeeCall() {
  try {
    const ripple = yield sologenic.getRippleApi();
    const rippleFee = yield ripple.getFee();

    console.log('FEE SAGA', rippleFee);

    if (rippleFee) {
      yield put(fillRippleFee(rippleFee));
    }
  } catch (e) {
    console.log('FETCH_RIPPLE_SAGA_ERROR', e);
  }
}

// TRANSFER XRP
function* transferXRPSaga() {
  yield takeLatest(`${transferXRP}`, transferXRPCall);
}

const transferXrp = (account, destination, value) => {
  const valueAmount = Number(value) / 0.000001;

  return sologenic.submit({
    TransactionType: 'Payment',
    Account: account,
    Destination: destination,
    Amount: `${valueAmount}`
  });
};

function* transferXRPCall(data) {
  try {
    const { account, keypair, destination, value, secret } = data.payload;

    var isValidSecret;

    if (secret !== '') {
      isValidSecret = sologenic.getRippleApi().isValidSecret(secret);
      // yield put(transferXrpSuccess());
      console.log('SECRET CHECK!!!!!!!!!', isValidSecret);
    }

    // const secret = keypair ? keypair : '';
    console.log('BEFORE YIELD SET ACCOUNT', data.payload);
    yield call(setAccount, account, secret, keypair);
    console.log('BEFORE YIELD TRANSFERXRP');
    const tx = yield call(transferXrp, account, destination, value);
    console.log('tx', tx);
    const response = yield tx.promise;
    console.log('TRANSFER RESPONSE', response);
    if (response) {
      yield put(transferXrpSuccess(response));
    }
  } catch (e) {
    console.log('TRANSFER_XRP_ERROR ->', e);
  }
}

// TRANSFER SOLO
function* transferSOLOSaga() {
  yield takeLatest(`${transferSOLO}`, transferSOLOCall);
}

const transferSolo = (account, destination, value) => {
  return sologenic.submit({
    TransactionType: 'Payment',
    Account: account,
    Destination: destination,
    SendMax: {
      currency: configVars.soloHash,
      issuer: configVars.soloIssuer,
      value: value
    },
    Amount: {
      currency: configVars.soloHash,
      issuer: configVars.soloIssuer,
      value: String(Number(value) - Number(value) * 0.0001)
    }
  });
};

function* transferSOLOCall(data) {
  try {
    const { account, keypair, destination, value, secret } = data.payload;

    // const secret = keypair ? keypair : '';
    console.log('BEFORE YIELD SET ACCOUNT', data.payload);
    yield call(setAccount, account, secret, keypair);
    console.log('BEFORE YIELD TRANSFERSOLO');
    const tx = yield call(transferSolo, account, destination, value);
    console.log('tx', tx);
    const response = yield tx.promise;
    console.log('TRANSFER RESPONSE', response);
    if (response) {
      yield put(transferSoloSuccess(response));
    }
  } catch (e) {
    console.log('TRANSFER_SOLO_ERROR -> ', e);
  }
}

// CREATE TRUSTLINE
function* createTrustlineSaga() {
  yield takeLatest(`${createTrustlineRequest}`, createTrustlineCall);
}

const setAccount = (address, secret, keypair) => {
  console.log('SET ACCOUNT ---->', address, secret, keypair);

  if (keypair.publicKey) {
    return sologenic.setAccount({
      address,
      keypair
    });
  }

  return sologenic.setAccount({
    address,
    secret
    // secret: 'ssyBY4mUyoXJoMKqKbqfZJQSzPo6H'
  });
};

const setTrustline = account => {
  const solo = '534F4C4F00000000000000000000000000000000';
  return sologenic.submit({
    TransactionType: 'TrustSet',
    Account: account,
    LimitAmount: {
      currency: solo,
      issuer: configVars.soloIssuer,
      // issuer: 'rEFgkRo5BTxXJiLVYMdEnQQ9J9Kj1F3Yvi', //this is a test issuer for solo which is generated by sologenic-issuarance
      value: configVars.soloIssuerValue
    },
    // Flags: 0x00020000
    Flags: configVars.soloFlags
  });
};

function* createTrustlineCall(data) {
  try {
    console.log('CREATE_TRUSTLINE ->>>>>>>>>>>>', data);
    const { address, secret, keypair, id } = data.payload;

    yield call(setAccount, address, secret, keypair);

    const ripple = sologenic.getRippleApi();
    const ts = yield ripple.getTrustlines(address, {
      counterparty: configVars.soloIssuer
    });

    if (ts.length > 0) {
      yield put(createTrustlineSuccess(id));
    } else {
      const tx = yield call(setTrustline, address);

      console.log('tx ------->>>', tx);
      const response = yield tx.promise;

      if (response) {
        yield put(createTrustlineSuccess(id));
      }
    }
  } catch (e) {
    console.log('CREATE_TRUSTLINE_ERROR ->', e);
    yield put(createTrustlineError());
  }
}

// GET SOLO PRICE
function* getSoloPriceSaga() {
  yield takeLatest(`${getSoloPrice}`, getSoloPriceCall);
}

const getSoloPriceOps = () => ops.get('/solo_rates.json');

function* getSoloPriceCall() {
  try {
    const response = yield call(getSoloPriceOps);

    if (response) {
      yield put(fillSoloPrice(response.data));
    }

    console.log('SOLO RATES', response);
  } catch (e) {
    console.log('GET_SOLO_PRICE_ERROR', e);
  }
}

// GET TRANSACTIONS
function* getTransactionsSaga() {
  yield takeLatest(`${getTransactions}`, getTransactionsCall);
}

const getTransactionsApi = async (address, limit) => {
  const rippleApi = sologenic.getRippleApi();
  const currentLedger = await rippleApi.getLedgerVersion();
  const serverInfo = await rippleApi.getServerInfo();
  console.log('currentLedger', currentLedger);
  const ledgers = serverInfo.completeLedgers.split('-');
  const minLedgerVersion = Number(ledgers[0]);
  const maxLedgerVersion = Number(ledgers[1]);

  let txs = await rippleApi.getTransactions(address, {
    minLedgerVersion: minLedgerVersion,
    maxLedgerVersion: maxLedgerVersion,
    limit
  });

  let txsObj = {
    txs,
    currentLedger
  };

  return txsObj;
};

function* getTransactionsCall(data) {
  try {
    const { address, limit } = data.payload;
    console.log('GET ---------------->', data);
    const response = yield call(getTransactionsApi, address, limit);

    console.log('GET_TRANSACTIONS_RESPONSE ->', response);
    if (response) {
      yield put(getTransactionsSuccess(response));
    }
  } catch (e) {
    console.log('GET_TRANSACTION_ERROR -> ', e);
    yield put(getTransactionsError(e));
  }
}

// GET MARKET SEVENS
function* getMarketSevensSaga() {
  yield takeLatest(`${getMarketSevens}`, getMarketSevensCall);
}

function* getMarketSevensCall(data) {
  try {
    // console.log('GET_MARKET_7 ->', data);

    const response = yield call(getMarketSevensApi);
    console.log('RESPONSE 7', response);

    if (response.ok) {
      const sevenObj = yield createSevensObj(response.data);
      yield put(getMarketSevensSuccess(sevenObj));
    }
  } catch (e) {
    console.log('GET_MARKET_SEVENS_ERROR ->', e);
  }
}

// GET MARKET DATA
function* getMarketDataSaga() {
  yield takeLatest(`${getMarketData}`, getMarketDataCall);
}

const getMarketDataApi = defaultCurrency =>
  api.get(`tickers/xrp${defaultCurrency}`);

function* getMarketDataCall(data) {
  try {
    const { defaultFiat } = data.payload;

    const response = yield call(getMarketDataApi, defaultFiat);
    if (response.ok) {
      yield put(getMarketDataSuccess(response.data.markets[0]));
    } else {
      yield put(getMarketDataError(response.data));
    }

    console.log('GET_MARKET_DATA_CALL ->', response);
  } catch (e) {
    console.log('GET_MARKET_DATA_ERROR -> ', e);
  }
}

// CONNECT TO RIPPLE API
function* connectToRippleApiSaga() {
  yield takeLatest(`${connectToRippleApi}`, connectToRippleApiCall);
}

function* connectToRippleApiCall() {
  try {
    const a = yield sologenic.connect();

    // console.log(a);

    yield sologenic.on('queued', (id, tx) => {
      console.log('TX QUEUED: ', id, tx);
    });
    yield sologenic.on('dispatched', (id, tx) => {
      console.log('TX DISPATCHED:', id, tx);
    });
    yield sologenic.on('requeued', (id, tx) => {
      console.log('TX REQUEUED:', id, tx);
    });
    yield sologenic.on('warning', (id, type, tx) => {
      console.log('TX WARNING:', id, type, tx);
    });
    yield sologenic.on('validated', (id, tx) => {
      console.log('TX VALIDATED:', id, tx);
    });
    yield sologenic.on('failed', (id, type, tx) => {
      console.log('TX FAILED:', id, type, tx);
    });
    console.log('start');

    // yield put(setConnection(true));
  } catch (error) {
    // yield put(connectToRippleApiError());
    console.log('REQUEST_CONNECT_RIPPLE_API_ERROR', error);
    // yield put(setConnection(false));
  }
}

// GET BALANCE
function* getBalanceSaga() {
  yield takeLatest(`${getBalance}`, requestBalance);
}

const getBalances = address => {
  const rippleApi = sologenic.getRippleApi();
  return rippleApi.getBalances(address);
};

function* requestBalance(data) {
  try {
    const { id, address } = data.payload;

    const response = yield call(getBalances, address);
    console.log('REQUEST_BALANCE_SAGA ->', response);
    const xrpBalance = response.filter(item => item.currency === 'XRP');
    const soloBalance = response.filter(
      item => item.currency === configVars.soloHash
    );

    console.log('LE SOLO BALANCE -------->', soloBalance);

    if (response) {
      yield put(
        getBalanceSuccess({
          id,
          amountXrp: Number(xrpBalance[0].value),
          amountSolo:
            soloBalance.length === 0 ? 0 : Number(soloBalance[0].value)
        })
      );
    }
  } catch (e) {
    console.log('REQUEST_BALANCE_ERROR -> ', e);
  }
}

export default function* rootSaga() {
  yield all([
    fork(testingSagaSaga),
    // fork(addNewWalletSaga),
    fork(connectToRippleApiSaga),
    fork(getBalanceSaga),
    fork(getMarketDataSaga),
    fork(getMarketSevensSaga),
    fork(getTransactionsSaga),
    fork(createTrustlineSaga),
    fork(transferXRPSaga),
    fork(transferSOLOSaga),
    fork(getSoloPriceSaga),
    fork(fetchRippleFeeSaga)
  ]);
}
