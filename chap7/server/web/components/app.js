require('!!file-loader?name=[name].[ext]!../index.html')
/* required library for our React app */
var React = require("react")
var createReactClass = require('create-react-class')

/* required css for our application */
require('../webflow/css/orders.css');
require('../webflow/css/order.css');
require('../webflow/css/loader.css');
require('../webflow/css/modal.css');

const HTTP = require("./http.js").default
const routes = require("./routes.js")

const Link = require("./component/link.js")

var Child = createReactClass({
  render() {
    var [ChildHandler, ...rest] = this.props.handlerPath
    return <ChildHandler {...this.props} handlerPath={rest} />
  }
})

var browserState = {}

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

    console.log("Fetching remote props", remoteProps);

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

async function inferPropsChange(path, query, cookies) { // the second part of the onPathChange function have been moved here
  browserState = {
    ...browserState,
    path: path, qs: query,
    Link: Link,
    Child: Child
  }

  var route, routeProps
  for (var key in routes) {
    routeProps = routes[key].match(path, query)
    if (routeProps) {
      route = key
      break
    }
  }

  if (!route) {
    return new Promise((res, reject) => reject({ http_code: 408 }))
  }
  browserState = {
    ...browserState,
    ...routeProps,
    route: route
  }

  const props_1 = await addRemoteProps(browserState);
  browserState = props_1;
}

export default {
  reaxt_server_render(params, render) {
    inferPropsChange(params.path, params.query, params.cookies)
      .then(() => {
        render(<Child {...browserState} />)
      }, (err) => {
        render(<ErrorPage message={"Not Found :" + err} code={err.http_code} />, err.http_code)
      })
  },
  reaxt_client_render(initialProps, render) {
    browserState = initialProps
    Link.renderFunc = render
    window.addEventListener("popstate", () => { Link.onPathChange() })
    Link.onPathChange()
  }
}
