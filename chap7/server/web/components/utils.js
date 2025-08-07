
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

export default cn

