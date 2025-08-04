require('!!file-loader?name=[name].[ext]!./index.html')
/* required library for our React app */
var ReactDOM = require('react-dom')
var React = require("react")
var createReactClass = require('create-react-class')
var Qs = require('qs')
var Cookie = require('cookie')
var XMLHttpRequest = require("xhr2")
var HTTP = new (function () {
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

/* required css for our application */
require('./webflow/css/tuto.webflow.css');

var GoTo = (route, params, query) => {
  var qs = Qs.stringify(query)
  var url = routes[route].path(params) + ((qs == '') ? '' : ('?' + qs))
  history.pushState({}, "", url)
  console.log("Navigated to:", url);
  
  onPathChange()
}

var Child = createReactClass({
  render() {
    var [ChildHandler, ...rest] = this.props.handlerPath
    return <ChildHandler {...this.props} handlerPath={rest} />
  }
})

var browserState = { Child: Child, goTo: GoTo }

var remoteProps = {
  // user: (props) => {
  //   return {
  //     url: "/api/me",
  //     prop: "user"
  //   }
  // },
  orders: (props) => {
    // if (!props.user)
    //   return
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
      var r = new RegExp("/order/([^/]*)$").exec(path)
      return r && { handlerPath: [Layout, Header, Order], order_id: r[1] }
    }
  }
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

  var route

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
    route: route
  }
  addRemoteProps(browserState).then(
    (props) => {
      browserState = props
      // Log our new browserState
      console.log(browserState)
      // Render our components using our remote data
      ReactDOM.render(<Child {...browserState} />, document.getElementById('root'))
    }, (res) => {
      console.error("Error while fetching remote data", res)
      ReactDOM.render(<ErrorPage message={"Shit happened"} code={res.http_code} />, document.getElementById('root'))
    })
}

var Layout = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".layout">
      <Z sel=".layout-container">
        <this.props.Child {...this.props} />
      </Z>
    </JSXZ>
  }
})

var Header = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".header">
      <Z sel=".header-container">
        <this.props.Child {...this.props} />
      </Z>
    </JSXZ>
  }
})

var Orders = createReactClass({
  statics: {
    remoteProps: [remoteProps.orders]
  },
  render() {
    const orders = this.props.orders?.value || { items: [] };

    return <JSXZ in="orders" sel=".orders">
      <Z sel=".tab-header"><ChildrenZ /></Z>
      <Z sel=".tab-body">
        {orders.items.map(item => {
          const order = item.value
          return (
            <JSXZ key={order.remoteid} in="orders" sel=".tab-line">
              <Z sel=".col-1">{order.remoteid}</Z>
              <Z sel=".col-2">{order.custom?.customer?.full_name}</Z>
              <Z sel=".col-3">{formatAddress(order.custom?.billing_address)}</Z>
              <Z sel=".col-4">{order.custom?.items.length}</Z>
              <Z sel=".col-5"><a href={`/order/${order.id}`} className="w-inline-block"><ChildrenZ /></a></Z>
            </JSXZ>)
        })}
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
    return <JSXZ in="details" sel=".order">
      <Z sel=".order-details">
        <JSXZ in="details" sel=".customer-details-label" />
        <JSXZ in="details" sel=".customer-details-value">
          <Z sel=".customer-name-details-value">{order.custom?.customer?.full_name}</Z>
          <Z sel=".address-details-value">{formatAddress(order.custom?.billing_address)}</Z>
          <Z sel=".customer-number-details-value">{order.remoteid}</Z>
        </JSXZ>
      </Z>
      <Z sel=".tab-details-body">
        {order.custom.items.map(item => {
          return (
            <JSXZ key={item.item_id} in="details" sel=".tab-details-line">
              <Z sel=".col-1">{item.product_title}</Z>
              <Z sel=".col-2">{item.quantity_to_fetch}</Z>
              <Z sel=".col-3">{item.unit_price}</Z>
              <Z sel=".col-4">{item.price}</Z>
            </JSXZ>)
        })}
      </Z>
      <Z sel=".link">
        <a onClick={() => this.props.goTo("orders")} className="link">Go back</a>
      </Z>

    </JSXZ>
  }
})

var ErrorPage = createReactClass({
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
        .map((c) => c.remoteProps) // -> [[remoteProps.orders], null]
        .filter((p) => p) // -> [[remoteProps.orders]]
    )

    remoteProps = remoteProps
      .map((spec_fun) => spec_fun(props)) // [{url: '/api/orders', prop: 'orders'}]
      .filter((specs) => specs) // get rid of undefined from remoteProps that don't match their dependencies
      .filter((specs) => !props[specs.prop] || props[specs.prop].url != specs.url) // get rid of remoteProps already resolved with the url
    if (remoteProps.length == 0)
      return resolve(props)
    // All remoteProps can be queried in parallel. This is just the function definition, see its use below.
    const promise_mapper = (spec) => {
      // we want to keep the url in the value resolved by the promise here : spec = {url: '/api/orders', value: ORDERS, prop: 'orders'}
      return HTTP.get(spec.url).then((res) => { spec.value = res; return spec })
    }

    const reducer = (acc, spec) => {
      // spec = url: '/api/orders', value: ORDERS, prop: 'user'}
      acc[spec.prop] = { url: spec.url, value: spec.value }
      return acc
    }

    const promise_array = remoteProps.map(promise_mapper)
    return Promise.all(promise_array)
      .then(xs => xs.reduce(reducer, props), reject)
      .then((p) => {
        // recursively call remote props, because props computed from
        // previous queries can give the missing data/props necessary
        // to define another query
        return addRemoteProps(p).then(resolve, reject)
      }, reject)
  })
}

window.addEventListener('popstate', onPathChange);
onPathChange();
