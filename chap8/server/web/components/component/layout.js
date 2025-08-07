var cn = require('../utils').default
var createReactClass = require('create-react-class')
var React = require("react")

const DeleteModal = createReactClass({
  render() {
    const { callback, title, message } = this.props
    return (
      <JSXZ in="confirmation" sel=".modal-content">
        <Z sel=".modal-title">{title}</Z>
        <Z sel=".modal-text">{message}</Z>
        <Z sel=".modal-cancel" onClick={() => callback(false)}>
          <ChildrenZ />
        </Z>
        <Z sel=".modal-submit" onClick={() => callback(true)}>
          <ChildrenZ />
        </Z>
      </JSXZ>)
  }
})

const Loader = createReactClass({
  render() {
    return <JSXZ in="loader" sel=".loader-content" />;
  },
});

const Layout = createReactClass({
  modal(spec) {
    this.setState({
      modal: {
        ...spec, callback: (res) => {
          this.setState({ modal: null }, () => {
            if (spec.callback) spec.callback(res)
          })
        }
      }
    })
  },
  loader(spec) {
    this.setState({
      loader: true,
    });
    spec.finally(() => {
      this.setState({ loader: false });
    });
  },
  getInitialState() {
    return { modal: null, loader: false };
  },
  render() {
    let modalComponent = {
      'delete': (props) => <DeleteModal {...props} />
    }[this.state.modal?.type];
    modalComponent = modalComponent && modalComponent(this.state.modal)
    var props = {
      ...this.props, modal: this.modal, loader: this.loader
    }

    return <JSXZ in="orders" sel=".layout">
      <Z sel=".layout-container">
        <this.props.Child {...props} />
      </Z>
      <Z sel=".modal-wrapper" className={cn(classNameZ, { 'hidden': !modalComponent })}>
        {modalComponent}
      </Z>
      <Z
        sel=".loader-wrapper"
        className={cn(classNameZ, { hidden: !this.state.loader })}
      >
        <Loader />
      </Z>
    </JSXZ>
  }
})

module.exports = Layout;
