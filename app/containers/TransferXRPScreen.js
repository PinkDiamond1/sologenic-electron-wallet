import React, { Component } from 'react';
import { withStyles, Dialog, CircularProgress } from '@material-ui/core';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Colors from '../constants/Colors';
import Images from '../constants/Images';
import ScreenHeader from '../components/shared/ScreenHeader';
import { transferXRP, cleanTransferInProgress } from '../actions/index';
import { CheckCircle, Close } from '@material-ui/icons';

class TransferXRPScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userInput: 0,
      amountInFiat: 0,
      openValidationModal: false,
      openSummaryModal: false,
      destination: '',
      destinationTag: '',
      transactionInProgress: false,
      wasTransferSuccess: false,
      errorInTransfer: false,
      reason: ''
    };
    this.calculateFiat = this.calculateFiat.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.startSending = this.startSending.bind(this);
    this.closeValidationModal = this.closeValidationModal.bind(this);
    this.confirmTransfer = this.confirmTransfer.bind(this);
    this.cancelTransaction = this.cancelTransaction.bind(this);
    this.transferFinishedAndSuccess = this.transferFinishedAndSuccess.bind(
      this
    );
    this.closeSuccessModal = this.closeSuccessModal.bind(this);
    this.transferFinishedAndFailed = this.transferFinishedAndFailed.bind(this);
    this.closeFailModal = this.closeFailModal.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.transferInProgress.updated !==
      this.props.transferInProgress.updated
    ) {
      if (!this.props.transferInProgress.transfer.success) {
        this.transferFinishedAndFailed({
          reason: this.props.transferInProgress.transfer.reason
        });
      } else {
        this.transferFinishedAndSuccess();
      }
    }
  }

  transferFinishedAndFailed(reason) {
    console.log('TX FAILED!!!!!!!!', reason);
    let readableReason;

    switch (reason.reason) {
      case 'tecUNFUNDED_PAYMENT':
        readableReason = 'Not Enough Funds';
        break;
    }

    this.setState({
      errorInTransfer: true,
      reason: readableReason,
      openSummaryModal: false
    });
  }

  async closeFailModal() {
    await this.props.cleanTransferInProgress();

    this.setState({
      errorInTransfer: false,
      reason: ''
    });
  }

  transferFinishedAndSuccess() {
    this.setState({
      wasTransferSuccess: true,
      openSummaryModal: false
    });
  }

  async closeSuccessModal() {
    await this.props.cleanTransferInProgress();

    this.setState({
      wasTransferSuccess: false
    });
  }

  startSending() {
    const amount = this.state.userInput;
    const destination = this.refs.destinationAddress.value.trim();
    const tag = this.refs.destinationTag.value.trim();

    console.log('SEND XRP', this.props.location.state.wallet);

    if (amount === '' || destination === '') {
      this.setState({
        openValidationModal: true
      });
    } else {
      // console.log('SENDING');
      // const { wallet } = this.props.location.state;
      // const keypair = {
      //   privateKey: wallet.details.wallet.privateKey,
      //   publicKey: wallet.details.wallet.publicKey
      // };

      this.setState({
        destination: destination,
        destinationTag: tag,
        openSummaryModal: true
      });
      // this.props.transferXRP({
      //   account: wallet.walletAddress,
      //   keypair,
      //   destination: destination,
      //   value: amount
      // });
    }
  }

  cancelTransaction() {
    this.setState({
      openSummaryModal: false
    });
  }

  async confirmTransfer() {
    this.setState({
      transactionInProgress: true
    });

    const { wallet } = this.props.location.state;
    const keypair = {
      privateKey: wallet.details.wallet.privateKey,
      publicKey: wallet.details.wallet.publicKey
    };

    await this.props.transferXRP({
      account: wallet.walletAddress,
      keypair,
      destination: this.state.destination,
      value: this.state.userInput
    });
  }

  closeValidationModal() {
    this.setState({
      openValidationModal: false
    });
  }

  calculateFiat(e) {
    const text = e.currentTarget.value.trim();

    var t = text.replace(/[^0-9.]/g, '');

    const fiatPrice = Number(t) * this.props.marketData.market.last;

    console.log(fiatPrice);

    this.setState({
      userInput: t,
      amountInFiat: fiatPrice
    });
  }

  onFocus(e) {
    e.target.select();
  }

  render() {
    const { classes, location, defaultFiat } = this.props;
    const { wallet } = location.state;
    const {
      userInput,
      amountInFiat,
      openValidationModal,
      destination,
      destinationTag,
      openSummaryModal,
      transactionInProgress,
      wasTransferSuccess,
      errorInTransfer,
      reason
    } = this.state;

    return (
      <div>
        <ScreenHeader
          title="Send XRP"
          dark
          showSettings={false}
          showBackArrow
        />
        <div className={classes.balanceHeader}>
          <img src={Images.xrp} />
          <p>{wallet.balance.xrp} XRP</p>
        </div>
        <div className={classes.inputsContainer}>
          <div
            className={`${classes.amountToSend} ${classes.sendInputWrapper}`}
          >
            <label>Amount to Send</label>
            <input
              type="text"
              value={userInput}
              ref="amountToSend"
              onChange={e => this.calculateFiat(e)}
              onFocus={e => this.onFocus(e)}
            />
            <span className={classes.inputAdornment}>XRP</span>
          </div>
          <p className={classes.amountInFiat}>
            <em>{defaultFiat.symbol}</em>
            {amountInFiat.toFixed(2)}{' '}
            <b>{defaultFiat.currency.toUpperCase()}</b>
          </p>
          <div
            className={`${classes.destinationAddress} ${classes.sendInputWrapper}`}
          >
            <label>Destination Address</label>
            <input type="text" ref="destinationAddress" />
          </div>
          <div
            className={`${classes.destinationTag} ${classes.sendInputWrapper}`}
          >
            <label>Destination Tag</label>
            <input type="text" ref="destinationTag" />
          </div>
          <div className={classes.optionalDiv}>
            <span style={{ color: Colors.freshGreen }}>Optional</span>
          </div>
        </div>
        <div className={classes.sendBtn}>
          <button onClick={this.startSending}>SEND</button>
        </div>
        <Dialog
          open={openValidationModal}
          classes={{ paper: classes.validationModal }}
        >
          <div className={classes.validationMessage}>
            <h1>Error</h1>
            <p>"Amount to Send" or "Destination Address" cannot be empty!</p>
          </div>
          <div className={classes.dismissBtn}>
            <button onClick={this.closeValidationModal}>DISMISS</button>
          </div>
        </Dialog>
        <Dialog
          open={openSummaryModal}
          classes={{ paper: classes.validationModal }}
        >
          <h1 className={classes.summaryTitle}>Transfer Summary</h1>
          <div className={classes.summaryAmount}>
            <span>Amount to Send:</span>
            <h2>{userInput} XRP</h2>
            <p>
              {defaultFiat.symbol} {amountInFiat.toFixed(2)}{' '}
              {defaultFiat.currency.toUpperCase()}
            </p>
          </div>
          <div className={classes.summaryDestination}>
            <span>To Address:</span>
            <p>{destination}</p>
          </div>
          <div className={classes.summaryDestination}>
            <span>Destination Tag:</span>
            <p>{destinationTag}</p>
          </div>
          <div className={classes.summaryBtns}>
            {transactionInProgress ? (
              ''
            ) : (
              <button onClick={this.cancelTransaction}>CANCEL</button>
            )}
            {transactionInProgress ? (
              <CircularProgress
                classes={{
                  circle: classes.confiramtionLoader,
                  root: classes.confirmationWrapper
                }}
              />
            ) : (
              <button
                className={classes.summayConfirmBtn}
                onClick={this.confirmTransfer}
              >
                CONFIRM
              </button>
            )}
          </div>
        </Dialog>
        <Dialog
          open={wasTransferSuccess}
          // open
          classes={{ paper: classes.validationModal }}
        >
          <h1 className={classes.transferSuccessTitle}>Transfer Successful</h1>
          <div className={classes.transferSuccessBody}>
            <p>Your XRP transfer has been successfully completed</p>{' '}
            <CheckCircle />
          </div>
          <div className={classes.successBtnContainer}>
            <button
              onClick={this.closeSuccessModal}
              className={classes.successBtn}
            >
              VIEW WALLET
            </button>
          </div>
        </Dialog>
        <Dialog
          open={errorInTransfer}
          classes={{ paper: classes.validationModal }}
        >
          <h1 className={classes.transferSuccessTitle}>Transfer Failed</h1>
          <div className={classes.transferFailedBody}>
            <p>{reason}</p> <Close />
          </div>
          <div className={classes.failBtnContainer}>
            <button onClick={this.closeFailModal} className={classes.failBtn}>
              DISMISS
            </button>
          </div>
        </Dialog>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    defaultFiat: state.defaultFiat,
    marketData: state.marketData,
    transferInProgress: state.transferInProgress
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ transferXRP, cleanTransferInProgress }, dispatch);
}

const styles = theme => ({
  transferFailedBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    margin: '12px auto',
    '& p': {
      fontSize: 16,
      color: 'white',
      width: '80%'
    },
    '& svg': {
      background: Colors.errorBackground,
      borderRadius: 50,
      fontSize: 16
    }
  },
  failBtnContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    borderTop: `1px solid ${Colors.gray}`,
    padding: '12px 0',
    '& button': {
      background: 'none',
      border: 'none',
      fontSize: 18,
      color: Colors.lightGray,
      marginRight: 12
    }
  },
  transferSuccessTitle: {
    color: 'white',
    fontSize: 24,
    // textAlign: 'center',
    padding: '27px 100px'
  },
  successBtnContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    borderTop: `1px solid ${Colors.gray}`,
    padding: '12px 0',
    '& button': {
      background: 'none',
      border: 'none',
      fontSize: 18,
      color: Colors.freshGreen,
      marginRight: 12
    }
  },
  transferSuccessBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    margin: '12px auto',
    '& p': {
      fontSize: 16,
      color: 'white',
      width: '80%'
    },
    '& svg': {
      color: Colors.freshGreen,
      fontSize: 16
    }
  },
  summaryTitle: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    padding: '27px 100px'
  },
  summaryAmount: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '70%',
    margin: '0 auto 12px',
    '& span': {
      fontSize: 14,
      color: Colors.lightGray
    },
    '& h2': {
      color: 'white',
      fontSize: 24,
      margin: '6px 0'
    },
    '& p': {
      fontSize: 14,
      color: Colors.lightGray
    }
  },
  summaryDestination: {
    width: '90%',
    margin: '12px auto',
    '& span': {
      fontSize: 12,
      color: Colors.lightGray
    },
    '& p': {
      fontSize: 16,
      color: 'white',
      marginTop: 3
    }
  },
  summaryBtns: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTop: `1px solid ${Colors.gray}`,
    '& button': {
      border: 'none',
      background: 'none',
      fontSize: 18,
      cursor: 'pointer',
      transition: '.2s',
      height: 50,
      color: Colors.freshGreen,
      marginRight: 6,
      '&:first-of-type': {
        color: Colors.lightGray
      },
      '&:hover': {
        opacity: 0.7,
        transition: '.2s'
      }
    }
  },
  validationModal: {
    background: Colors.darkerGray
  },
  confirmationWrapper: {
    margin: '10px 36px 10px 0'
  },
  confiramtionLoader: {
    color: Colors.freshGreen
  },
  validationMessage: {
    '& h1': {
      fontSize: 32,
      fontWeight: 300,
      color: 'white',
      padding: 12
    },
    '& p': {
      fontSize: 16,
      color: 'white',
      padding: 12
    }
  },
  dismissBtn: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    borderTop: `1px solid ${Colors.gray}`,
    padding: '12px 0',
    '& button': {
      background: 'none',
      border: 'none',
      fontSize: 20,
      color: Colors.lightGray,
      marginRight: 12
    }
  },
  sendBtn: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '70%',
    margin: '24px auto 0',
    '& button': {
      background: Colors.darkRed,
      color: 'white',
      fontSize: 20,
      borderRadius: 25,
      border: 'none',
      width: 150,
      padding: '12px 0',
      cursor: 'pointer',
      transition: '.2s',
      '&:hover': {
        opacity: 0.7,
        transition: '.2s'
      }
    }
  },
  amountInFiat: {
    width: '65%',
    margin: '12px auto 18px',
    paddingBottom: 8,
    color: Colors.gray,
    borderBottom: `3px solid ${Colors.gray}`,
    fontSize: 20,
    display: 'flex',
    justifyContent: 'flex-end',
    '& b': {
      marginLeft: 'auto'
    },
    '& em': {
      fontStyle: 'normal'
    }
  },

  balanceHeader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    '& img': {
      marginRight: 10,
      width: 35,
      height: 'auto'
    },
    '& p': {
      fontSize: 28
    }
  },
  optionalDiv: {
    width: '70%',
    margin: '12px auto 0',
    '& span': {
      paddingLeft: 12
    }
  },
  sendInputWrapper: {
    background: Colors.darkGray,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '70%',
    margin: '0 auto 12px',
    padding: '16px 12px',
    borderRadius: 50,

    '& label': {
      color: Colors.lightGray,
      fontSize: 14,
      marginBottom: 10,
      paddingLeft: 12
    },
    '& input': {
      color: 'white',
      border: 'none',
      background: 'none',
      fontSize: 20,
      paddingLeft: 12,
      '&:focus': {
        outline: 'none'
      }
    },
    '& span': {
      position: 'absolute',
      top: '50%',
      right: 30,
      transform: 'translateY(-50%)',
      color: 'white',
      fontSize: 20
    }
  }
});

export default withStyles(styles)(
  connect(mapStateToProps, mapDispatchToProps)(TransferXRPScreen)
);
