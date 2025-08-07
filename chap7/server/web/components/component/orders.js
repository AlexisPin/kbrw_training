var cn = require('../utils').default
var createReactClass = require('create-react-class')
var remoteProps = require('../props.js')
var HTTP = require('../http.js').default
var React = require("react")
var ReactDOM = require('react-dom')
var Link = require('./link.js')

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
    this.props.loader(
      this.setState({ page },
        () => {
          delete browserState.orders;
          Link.GoTo("orders", null, { page: this.state.page, rows: this.state.rows, sort: this.state.sort });
        }
      )
    );
  },
  quantities(quantityArray) {
    if (!quantityArray || !quantityArray.length) return 0;
    return quantityArray.reduce((acc, quantity) => acc + quantity, 0);
  },
  // onSearch(ev) {
  //   ev.preventDefault();

  //   const searchValue = ev.target.search.value;
  //   this.props.loader(
  //     HTTP.get(`/api/orders?page=${this.state.page}&rows=${this.state.rows}&sort=${this.state.sort}&${searchValue}`)
  //       .then((res) => {
  //         this.setState({ orders: res })
  //       })
  //   );
  // },
  render() {
    console.error(this.paginate)
    return <JSXZ in="orders" sel=".orders">
      <Z sel=".tab-body">
        {this.props.orders.value.map(order => {
          return (
            <JSXZ in="orders" sel=".tab-line" key={order.remoteid}>
              <Z sel=".col-1">{order.remoteid}</Z>
              <Z sel=".col-2">{order["custom.customer.full_name"]}</Z>
              <Z sel=".col-3">{order["custom.billing_address.street"][0]} {order["custom.billing_address.postcode"]} {order["custom.billing_address.city"]}</Z>
              <Z sel=".col-4">{this.quantities(order["custom.items.quantity_to_fetch"])}</Z>

              <Z
                sel=".col-5">
                <Link to="order" params={order.id} query={{}}>
                  <ChildrenZ />
                </Link>
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
                        .then((res) => {
                          delete browserState.orders;
                          Link.GoTo("orders", null, { page: this.state.page });
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
        className={cn({ 'hidden': this.state.page < 2, classNameZ })}
        onClick={() => this.paginate(0)}
      >
        <ChildrenZ />
      </Z>
      <Z
        sel=".prev-page"
        tag="button"
        className={cn({ 'hidden': this.state.page == 0, classNameZ })}
        onClick={() => this.paginate(this.state.page - 1)}
      >
        {this.state.page}
      </Z>
      <Z sel=".current-page">{this.state.page + 1}</Z>
      <Z
        sel=".next-page"
        tag="button"
        onClick={() => this.paginate(this.state.page + 1)}
      >
        {this.state.page + 2}
      </Z>
    </JSXZ>
  }
})

module.exports = Orders;