require('!!file-loader?name=[name].[ext]!./index.html')
/* required library for our React app */
var ReactDOM = require('react-dom')
var React = require("react")
var createReactClass = require('create-react-class')
var Qs = require('qs')
var Cookie = require('cookie')
var XMLHttpRequest = require("xhr2")

/* required css for our application */
require('./webflow/css/orders.css');
require('./webflow/css/order.css');
require('./webflow/css/loader.css');
require('./webflow/css/modal.css');

const HTTP = new (function () {
  this.get = (url) => this.req('GET', url)
  this.delete = (url) => this.req('DELETE', url)
  this.post = (url, data) => this.req('POST', url, data)
  this.put = (url, data) => this.req('PUT', url, data)

  this.req = (method, url, data) => new Promise((resolve, reject) => {
    var req = new XMLHttpRequest()
    req.open(method, url)
    req.responseType = "text"
    req.setRequestHeader("accept", "application/json,*/*;0.8")
    req.setRequestHeader("content-type", "application/json")
    req.onload = () => {
      if (req.status >= 200 && req.status < 300) {
        resolve(req.responseText && JSON.parse(req.responseText))
      } else {
        reject({ http_code: req.status })
      }
    }
    req.onerror = (err) => {
      reject({ http_code: req.status })
    }
    req.send(data && JSON.stringify(data))
  })
})()

const goTo = (route, params, query) => {
  var qs = Qs.stringify(query)
  var url = routes[route].path(params) + ((qs == '') ? '' : ('?' + qs))
  history.pushState({}, "", url)
  onPathChange()
}

function cn() {
  var args = arguments, classes = {}
  for (var i in args) {
    var arg = args[i]
    if (!arg) continue
    if ('string' === typeof arg || 'number' === typeof arg) {
      arg.split(" ").filter((c) => c != "").map((c) => {
        classes[c] = true
      })
    } else if ('object' === typeof arg) {
      for (var key in arg) classes[key] = arg[key]
    }
  }
  return Object.keys(classes).map((k) => classes[k] && k || '').join(' ')
}

var Child = createReactClass({
  render() {
    var [ChildHandler, ...rest] = this.props.handlerPath
    return <ChildHandler {...this.props} handlerPath={rest} />
  }
})

var browserState = { Child: Child }

var remoteProps = {
  orders: (props) => {
    var qs = { ...props.qs }
    var query = Qs.stringify(qs)
    return {
      url: "/api/orders" + (query == '' ? '' : '?' + query),
      prop: "orders"
    }
  },
  order: (props) => {
    return {
      url: "/api/order/" + props.order_id,
      prop: "order"
    }
  }
}

var routes = {
  "orders": {
    path: (params) => {
      return "/";
    },
    match: (path, qs) => {
      return (path == "/") && { handlerPath: [Layout, Header, Orders] }
    }
  },
  "order": {
    path: (params) => {
      return "/order/" + params;
    },
    match: (path, qs) => {
      const r = new RegExp("/order/([^/]*)$").exec(path)
      return r && { handlerPath: [Layout, Header, Order], order_id: r[1] }
    }
  }
}

var Layout = createReactClass({
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

const Header = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".header">
      <Z sel=".header-container">
        <this.props.Child {...this.props} />
      </Z>
    </JSXZ>
  }
})

const Orders = createReactClass({
  statics: {
    remoteProps: [remoteProps.orders]
  },
  getInitialState() {
    return {
      page: 0,
      rows: 30,
      sort: 'creation_date_index',
    }
  },
  paginate(page) {
    this.setState({
      page: Math.max(0, page)
    }, () => {
      goTo("orders", null, { page: this.state.page * this.state.rows, rows: this.state.rows, sort: this.state.sort });
    });
  },
  onSearch(ev) {
    ev.preventDefault();
    const formData = new FormData(ev.target)
    const searchValue = formData.get('search')
    const [key, value] = searchValue.split(':')
    goTo("orders", null, { page: this.state.page, [key]: value });
  },
  render() {
    const orders = this.props.orders?.value || [];
    return <JSXZ in="orders" sel=".orders">
      <Z sel=".form" onSubmit={(ev) => this.onSearch(ev)}>
        <ChildrenZ />
      </Z>
      <Z sel=".tab-body">
        {orders.map(order => {
          return (
            <JSXZ in="orders" sel=".tab-line" key={order.remoteid}>
              <Z sel=".col-1">{order.remoteid}</Z>
              <Z sel=".col-2">{order["custom.customer.full_name"]}</Z>
              <Z sel=".col-3">{order["custom.billing_address.street"][0]} {order["custom.billing_address.postcode"]} {order["custom.billing_address.city"]}</Z>
              <Z sel=".col-4">{(order["custom.items.quantity_to_fetch"] || []).length}</Z>

              <Z
                sel=".col-5"
                onClick={() => goTo("order", order.id, null)}>
                <ChildrenZ />
              </Z>

              <Z tag="button" sel=".pay-button">Pay <ChildrenZ /></Z>
              <Z sel=".pay-status">State : {order["status.state"] || 'N/A'}</Z>
              <Z sel=".pay-method">Method: {order["custom.magento.payment.method"] || 'N/A'}</Z>

              <Z sel=".col-7" onClick={() => this.props.modal({
                type: 'delete',
                title: 'Order deletion',
                message: `Are you sure you want to delete this ?`,
                callback: (value) => {
                  if (value) {
                    const url = `/api/order/${order.id}`;
                    this.props.loader(
                      HTTP.delete(url)
                        .then(() => {
                          delete browserState.orders
                          goTo("orders", null, { page: this.state.page * this.state.rows, rows: this.state.rows, sort: this.state.sort });
                        })
                    );
                  }
                }
              })}>
                <ChildrenZ />
              </Z>
            </JSXZ>)
        })}
      </Z>

      <Z
        sel=".first-page"
        tag="button"
        className={cn({ 'hidden': this.state.page < 2 })}
        onClick={() => this.paginate(0)}
      >
        <ChildrenZ />
      </Z>
      <Z
        sel=".prev-page"
        tag="button"
        className={cn({ 'hidden': this.state.page == 0 })}
        onClick={() => this.paginate(this.state.page - 1)}
      >
        {this.state.page}
      </Z>
      <Z sel=".current-page">{this.state.page + 1}</Z>
      <Z
        sel=".next-page"
        tag="button"
        className={cn({ 'hidden': orders.length < this.state.rows })}
        onClick={() => this.paginate(this.state.page + 1)}
      >
        {this.state.page + 2}
      </Z>
    </JSXZ>
  }
})


const formatAddress = (billing_address) => {
  if (!billing_address) return "No address provided";
  return `${billing_address.street || ''}, ${billing_address.postcode || ''} ${billing_address.city || ''}`.trim();
}
var Order = createReactClass({
  statics: {
    remoteProps: [remoteProps.order]
  },
  render() {
    const order = this.props.order.value
    return <JSXZ in="details" sel=".container">
      <Z sel=".order-details">
        <JSXZ in="details" sel=".customer-details-label" />
        <JSXZ in="details" sel=".customer-details-value">
          <Z sel=".client-details-value">{order.custom?.customer?.full_name}</Z>
          <Z sel=".address-details-value">{formatAddress(order.custom?.billing_address)}</Z>
          <Z sel=".command-number-value">{order.remoteid}</Z>
        </JSXZ>
      </Z>
      <Z sel=".tab-details-body">
        {order.custom.items.map(item => (
          <JSXZ in="details" sel=".tab-details-line" key={item.item_id}>
            <Z sel=".col-1">{item.product_title}</Z>
            <Z sel=".col-2">{item.quantity_to_fetch}</Z>
            <Z sel=".col-3">{item.unit_price}</Z>
            <Z sel=".col-4">{item.unit_price * item.quantity_to_fetch}</Z>
          </JSXZ>)
        )}
      </Z>
      <Z sel=".b-button" onClick={() => goTo("orders", null, null)}>
        <ChildrenZ />
      </Z>
    </JSXZ>
  }
})

const ErrorPage = createReactClass({
  render() {
    return <div>
      <h1>Error {this.props.code}</h1>
      <p>{this.props.message}</p>
    </div>
  }
})

function addRemoteProps(props) {
  return new Promise((resolve, reject) => {
    var remoteProps = Array.prototype.concat.apply([],
      props.handlerPath
        .map((c) => c.remoteProps)
        .filter((p) => p)
    )

    remoteProps = remoteProps
      .map((spec_fun) => spec_fun(props)) // [{url: '/api/orders', prop: 'orders'}]
      .filter((specs) => specs) // get rid of undefined from remoteProps that don't match their dependencies
      .filter((specs) => !props[specs.prop] || props[specs.prop].url != specs.url) // get rid of remoteProps already resolved with the url
    if (remoteProps.length == 0)
      return resolve(props)
    console.log(remoteProps);

    const promise_mapper = async (spec) => {
      const res = await HTTP.get(spec.url)
      spec.value = res
      return spec
    }

    const reducer = (acc, spec) => {
      acc[spec.prop] = { url: spec.url, value: spec.value }
      return acc
    }
    const promise_array = remoteProps.map(promise_mapper)
    return Promise.all(promise_array)
      .then(xs => xs.reduce(reducer, props), reject)
      .then((p) => {
        return addRemoteProps(p).then(resolve, reject)
      }, reject)
  })
}

function onPathChange() {
  var path = location.pathname
  var qs = Qs.parse(location.search.slice(1))
  var cookies = Cookie.parse(document.cookie)

  browserState = {
    ...browserState,
    path: path,
    qs: qs,
    cookie: cookies
  }

  let route
  let routeProps

  for (var key in routes) {
    routeProps = routes[key].match(path, qs)
    if (routeProps) {
      route = key
      break;
    }
  }

  browserState = {
    ...browserState,
    ...routeProps,
    route
  }

  if (!route) {
    ReactDOM.render(<ErrorPage message={"Not Found"} code={404} />, document.getElementById('root'))
    return;
  }

  addRemoteProps(browserState).then(
    (props) => {
      browserState = props
      ReactDOM.render(<Child {...browserState} />, document.getElementById('root'))
    }, (res) => {
      ReactDOM.render(<ErrorPage message={"Shit happened"} code={res.http_code} />, document.getElementById('root'))
    })
}

window.addEventListener('popstate', onPathChange);
onPathChange();
