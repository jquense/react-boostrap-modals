import React from 'react';
import cn from 'classnames';
import Dismiss from './Dismiss';

class ModalHeader extends React.Component {

  static _isModalHeader = true

  static getDefaultPrefix(){
    return 'modal'
  }

  static defaultProps = {
    closeButton: false,
  }

  static contextTypes = {
    onModalHide: React.PropTypes.func
  }

  _removeUnknownDivProps(props) {
    const {closeButton, ...attrs} = props;
    return attrs;
  }

  render() {
    var prefix = this.props.modalPrefix || ModalHeader.getDefaultPrefix();

    const headerAttr = this._removeUnknownDivProps(this.props);

    return (
      <div {...headerAttr}
        data-closeButton={this.props.closeButton}
        className={cn(this.props.className,  prefix + '-header')}
      >
        { this.props.closeButton &&
          <Dismiss
            className='close'
            aria-label={this.props['aria-label'] || 'Close Modal'}
            style={{ marginTop: -2 }}
          >
            <span aria-hidden="true">
              &times;
            </span>
          </Dismiss>
        }
        { this.props.children }
      </div>
    )
  }
}

module.exports = ModalHeader
