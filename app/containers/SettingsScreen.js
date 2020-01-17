import React, { Component, useState } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import routes from '../constants/routes.js';

// MUI IMPORTS
import { withStyles } from '@material-ui/core/styles';
import { CheckCircle, Check } from '@material-ui/icons';

// APP COMPONENTS
import ScreeHeader from '../components/shared/ScreenHeader.js';

// OTHER COMPONENTS
import { Link } from 'react-router-dom';

// CONSTANTS
import Colors from '../constants/Colors';
import Images from '../constants/Images';

// ACTIONS
import { setDefaultFiatCurrency } from '../actions/index.js';

// STORAGE
import storage from 'electron-json-storage';

class SettingsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectFiatMenuOpen: false,
      selectedFiat: ''
    };
    this.setSelectedFiat = this.setSelectedFiat.bind(this);
    this.confirmSelectedFiat = this.confirmSelectedFiat.bind(this);
    this.closeChangeCurrencyModal = this.closeChangeCurrencyModal.bind(this);
  }

  openChangeCurrencyModal() {
    this.setState({
      selectFiatMenuOpen: true
    });
  }

  closeChangeCurrencyModal() {
    this.setState({
      selectFiatMenuOpen: false
    });
  }

  setSelectedFiat(fiat) {
    this.setState({
      selectedFiat: fiat
    });
  }

  confirmSelectedFiat() {
    this.props.setDefaultFiatCurrency(this.state.selectedFiat);
    storage.set(
      'defaultCurrency',
      { currency: this.state.selectedFiat },
      function(err) {
        if (err) {
          console.log('ERROR', err);
        }
      }
    );
    this.setState({ selectFiatMenuOpen: false });
  }

  render() {
    const { classes, defaultFiat } = this.props;
    const { selectFiatMenuOpen, selectedFiat } = this.state;
    const fiats = ['usd', 'cad', 'gbp', 'eur', 'jpy', 'aed'];

    return (
      <div>
        <ScreeHeader title="Settings" showSettings={false} />
        {selectFiatMenuOpen ? (
          <div className={classes.modalBkg}>
            <div className={classes.selectFiatMenu}>
              <p>Select Currency</p>
              <div className={classes.selectFiatContainer}>
                {fiats.map((item, idx) => {
                  return (
                    <span
                      key={idx}
                      className={`${
                        item === selectedFiat ? classes.activeFiat : ''
                      } ${classes.singleFiat}`}
                      onClick={() => this.setSelectedFiat(item)}
                    >
                      {item.toUpperCase()}
                      {item === defaultFiat.currency ? <CheckCircle /> : ''}
                    </span>
                  );
                })}
              </div>
              <div className={classes.btnContainers}>
                <button
                  className={`${classes.modalBtn} ${classes.cancelBtn}`}
                  onClick={this.closeChangeCurrencyModal}
                >
                  CANCEL
                </button>
                <button
                  className={`${classes.modalBtn} ${classes.confirmBtn}`}
                  onClick={this.confirmSelectedFiat}
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        ) : (
          ''
        )}
        <div className={classes.settingsFields}>
          <div className={classes.inputWrapper}>
            <label>Set Default Fiat Currency</label>
            <div
              onClick={this.openChangeCurrencyModal.bind(this)}
              className={classes.dropdownCurrency}
            >
              <span>{defaultFiat.currency.toUpperCase()}</span>
            </div>
          </div>
          <div className={classes.inputWrapper}>
            <label>Security</label>
            <Link className={classes.settingsLink} to={routes.ChangePinScreen}>
              <div className={classes.dropdownCurrency}>
                <span>Change Pin</span>
              </div>
            </Link>
          </div>
          <div className={classes.inputWrapper}>
            <label>Legal</label>
            <Link className={classes.settingsLink} to={routes.ChangePinScreen}>
              <div className={classes.dropdownCurrency}>
                <span>Terms & Conditions</span>
              </div>
            </Link>
            <Link className={classes.settingsLink} to={routes.ChangePinScreen}>
              <div className={classes.dropdownCurrency}>
                <span>Privacy Policy</span>
              </div>
            </Link>
          </div>
          <div className={classes.inputWrapper}>
            <label>Support</label>
            <Link className={classes.settingsLink} to={routes.ChangePinScreen}>
              <div className={classes.dropdownCurrency}>
                <span>Contact Us</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

const styles = theme => ({
  settingsFields: {
    width: '95%',
    margin: '24px auto 0'
  },
  inputWrapper: {
    marginBottom: 24,
    '& label': {
      paddingLeft: 24
    }
  },
  modalBkg: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    background: 'rgba(0,0,0,.8)',
    display: 'flex',
    justifyContent: 'center'
  },
  selectFiatMenu: {
    marginTop: '25%',
    background: Colors.darkerGray,
    height: 'auto',
    padding: 16,
    borderRadius: 10,
    width: '70%',
    maxHeight: 300
  },
  selectFiatContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: '16px 0'
  },
  singleFiat: {
    fontWeight: 300,
    padding: 12,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '& svg': {
      color: Colors.freshGreen,
      fontSize: 16
    }
  },
  activeFiat: {
    background: Colors.slabGray,
    borderRadius: 25
  },
  dropdownCurrency: {
    background: Colors.slabGray,
    width: '100%',
    padding: '16px 0',
    borderRadius: 25,
    marginTop: 8,
    '& span': {
      fontWeight: 300,
      padding: '0 24px'
    },
    '&:hover': {
      background: Colors.gray
    }
  },
  settingsLink: {
    color: 'white',
    textDecoration: 'none'
  }
});

function mapStateToProps(state) {
  return {
    defaultFiat: state.defaultFiat
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setDefaultFiatCurrency: setDefaultFiatCurrency
    },
    dispatch
  );
}

export default withStyles(styles)(
  connect(mapStateToProps, mapDispatchToProps)(SettingsScreen)
);
