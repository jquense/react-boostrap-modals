import React  from 'react';
import { findDOMNode } from 'react-dom';

import BaseModal from 'react-overlays/lib/Modal';
import isOverflowing from 'react-overlays/lib/utils/isOverflowing';
import componentOrElement from 'react-prop-types/lib/componentOrElement';

import Fade from './Fade';
import Body   from './Body';
import Header from './Header';
import Title from './Title';
import Footer from './Footer';
import Dismiss from './Dismiss';

import ownerDocument from 'dom-helpers/ownerDocument';
import canUseDOM from 'dom-helpers/util/inDOM';
import contains from 'dom-helpers/query/contains';
import classes from 'dom-helpers/class';
import events from 'dom-helpers/events';
import scrollbarWidth from 'dom-helpers/util/scrollbarSize';
import css from 'dom-helpers/style';
import cn from 'classnames';

var baseIndex = {};
var PREFIX = 'modal';

var getZIndex;

class Modal extends React.Component {

  static getDefaultPrefix(){
    return PREFIX
  }

  static propTypes = {
    show: React.PropTypes.bool,

    backdrop: React.PropTypes.oneOf(['static', true, false]),
    keyboard: React.PropTypes.bool,
    animate: React.PropTypes.bool,
    transition: React.PropTypes.any,
    container: React.PropTypes.oneOfType([componentOrElement, React.PropTypes.func]),

    onHide: React.PropTypes.func,
    onTransitionIn: React.PropTypes.func,
    onTransitionedIn: React.PropTypes.func,
    onTransitionOut: React.PropTypes.func,
    onTransitionedOut: React.PropTypes.func,

    modalPrefix: React.PropTypes.string,
    dialogClassName: React.PropTypes.string,
  }

  static defaultProps = {
    backdrop:           true,
    keyboard:           true,
    animate:            true,
    transition:         true,
    container:          document.body,
    attentionAnimation: 'shake',
  }

  static childContextTypes = {
    onModalHide: React.PropTypes.func
  }

  getChildContext(){
    return this._context || (this._context = { onModalHide: this.props.onHide })
  }

  constructor(){
    super()

    this._entering = this._entering.bind(this)
    this._exiting  = this._exiting.bind(this)

    this.state = {
      classes: ''
    }
  }

  componentDidMount() {
    getZIndex = getZIndex || (function () {
      var modal = document.createElement("div")
        , backdrop = document.createElement("div")
        , zIndexFactor;

      modal.className = 'modal hide'
      backdrop.className = 'modal-backdrop hide'

      document.body.appendChild(modal)
      document.body.appendChild(backdrop)

      baseIndex.modal = +css(modal, 'z-index')
      baseIndex.backdrop = +css(backdrop, 'z-index')
      zIndexFactor = baseIndex.modal - baseIndex.backdrop

      document.body.removeChild(modal)
      document.body.removeChild(backdrop)

      return function (type) {
        return baseIndex[type] + (zIndexFactor * (BaseModal.manager.modals.length - 1));
      }
    }())
  }

  _show(prevProps) {
    if (this.props.show)
      this.setState(this._getStyles())
  }

  _entering(...args) {
    this._show(...args);
    if ( this.props.onTransitionIn ) {
      this.props.onTransitionIn()
    }
  }

  _exiting() {
    this._removeAttentionClasses()
    if ( this.props.onTransitionOut ) {
      this.props.onTransitionOut();
    }
  }

  _removeUnknownDivProps(props) {
    const {
      show
      , animate
      , container
      , attentionAnimation
      , backdrop
      , small
      , sm
      , large
      , lg
      , onHide
      , ...attrs } = props;

    return attrs;
  }

  render() {
    var {
        className
      , children
      , keyboard
      , transition
      , ...props } = this.props
      , {
        dialog
      , backdrop } = this.state;

    let prefix = this.props.modalPrefix || Modal.getDefaultPrefix();

    const modalAttrs = this._removeUnknownDivProps(props);

    if (transition === true)
      transition = Fade;

    let modal = (
      <div {...modalAttrs}
        ref={r => this.dialog = r }
        style={dialog}
        className={cn(className, prefix, { in: props.show && !transition })}
        onClick={this.props.backdrop ? e => this.handleBackdropClick(e) : null}
      >
        <div
          key='modal'
          ref='inner'
          className={cn(
              prefix + '-dialog'
            , this.props.dialogClassName
            , this.state.classes, {
              [prefix + '-sm']: props.small || props.sm,
              [prefix + '-lg']: props.large || props.lg,
            }
          )}
        >
          <div className={prefix + '-content' }>
            { children }
          </div>
        </div>
      </div>
    )

    return (
      <BaseModal
        keyboard={keyboard}
        ref={ref => {
          this.modal = (ref && ref.refs.modal);
          this.backdrop = (ref && ref.refs.backdrop);
        }}
        container={this.props.container}
        backdrop={props.backdrop}
        show={props.show}
        onHide={this.props.onHide}
        onEntering={this._entering}
        onExiting={this._exiting}
      	onEnter={this.props.onTransitionedIn}
      	onExit={this.props.onTransitionedOut}
        backdropStyle={backdrop}
        backdropClassName={prefix + '-backdrop'}
        containerClassName={prefix + '-open'}
        transition={transition}
        dialogTransitionTimeout={Modal.TRANSITION_DURATION}
        backdropTransitionTimeout={Modal.BACKDROP_TRANSITION_DURATION}
      >
        { modal }
      </BaseModal>
    )
  }

  attention(){
    let { animate } = this.state
      , classes = this.props.attentionAnimation + ' animated';

    if (!animate)
      this.setState({ classes: '', animate: true }, ()=> {

        if (this.props.show) {
           // trigger reflow to allow animation
          this.refs.inner.offsetWidth
          this.setState({ animate: false, classes })
        }
      })
  }


  handleBackdropClick(e) {
    if (e.target !== e.currentTarget) return;
    if (this.props.backdrop === 'static')
      return this.attention()

    this.props.onHide();
  }

  _getStyles() {
    if ( !canUseDOM )
      return {}

    var node = findDOMNode(this.dialog)
      , doc = ownerDocument(node)
      , scrollHt = node.scrollHeight
      , bodyIsOverflowing = isOverflowing(this.props.container || doc.body)
      , modalIsOverflowing = scrollHt > doc.documentElement.clientHeight

    return {
      dialog: {
        zIndex: getZIndex('modal'),
        paddingRight: bodyIsOverflowing && !modalIsOverflowing ? scrollbarWidth() : void 0,
        paddingLeft:  !bodyIsOverflowing && modalIsOverflowing ? scrollbarWidth() : void 0
      },
      backdrop: {
        zIndex: getZIndex('backdrop')
      }
    }
  }

  _removeAttentionClasses() {
    this.setState({ classes: '' })
  }
}



Modal.injectCSSPrefix = function(prefix) {
  PREFIX = prefix;
};

function getDefaultPrefix(){
  return PREFIX
}

Body.getDefaultPrefix = getDefaultPrefix
Header.getDefaultPrefix = getDefaultPrefix
Title.getDefaultPrefix = getDefaultPrefix
Footer.getDefaultPrefix = getDefaultPrefix

Modal.Body = Body
Modal.Header = Header
Modal.Title = Title
Modal.Footer = Footer
Modal.Dismiss = Dismiss

Modal.BaseModal = Modal

Modal.TRANSITION_DURATION = 300;
Modal.BACKDROP_TRANSITION_DURATION = 150;

export default Modal;
