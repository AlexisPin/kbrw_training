const Qs = require('qs');
const Cookie = require('cookie');
var createReactClass = require('create-react-class')
var React = require("react")
var routes = require("../routes.js")
var Child = require("./child.js")
var ErrorPage = require("./error.js")
var HTTP = require('../http.js').default

var Link = createReactClass({
  statics: {
    renderFunc: null, //render function to use (differently set depending if we are server sided or client sided)
    GoTo(route, params, query) {// function used to change the path of our browser      
      var path = routes[route].path(params)
      var qs = Qs.stringify(query)
      var url = path + (qs == '' ? '' : '?' + qs)
      history.pushState({}, "", url)
      Link.onPathChange()
    },
    onPathChange() { //Updated onPathChange
      var path = location.pathname
      var qs = Qs.parse(location.search.slice(1))
      var cookies = Cookie.parse(document.cookie)
      inferPropsChange(path, qs, cookies).then( //inferPropsChange download the new props if the url query changed as done previously
        () => {
          Link.renderFunc(<Child {...browserState} />) //if we are on server side we render 
        }, ({ http_code }) => {
          Link.renderFunc(<ErrorPage message={"Not Found"} code={http_code} />, http_code) //idem
        }
      )
    },
    LinkTo: (route, params, query) => {
      var qs = Qs.stringify(query)
      return routes[route].path(params) + ((qs == '') ? '' : ('?' + qs))
    },
  },
  onClick(ev) {
    ev.preventDefault();
    Link.GoTo(this.props.to, this.props.params, this.props.query);
  },
  render() {//render a <Link> this way transform link into href path which allows on browser without javascript to work perfectly on the website
    return (
      <a href={Link.LinkTo(this.props.to, this.props.params, this.props.query)} onClick={this.onClick}>
        {this.props.children}
      </a>
    )
  }
})

let browserState = {}
function getBrowserState() {
  return browserState
}
function setBrowserState(state) {
  browserState = state
}

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

function inferPropsChange(path, query, cookies) { // the second part of the onPathChange function have been moved here
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
    return new Promise((res, reject) => reject({ http_code: 404 }))
  }
  browserState = {
    ...browserState,
    ...routeProps,
    route: route
  }

  return addRemoteProps(browserState).then(
    (props) => {
      browserState = props
    })
}

module.exports = {
  getBrowserState,
  setBrowserState,
  inferPropsChange,
  Link
}

