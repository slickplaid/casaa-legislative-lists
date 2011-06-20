coffee = require 'coffee-script'
connect = require 'connect'
express = require 'express'
io = require 'socket.io'
redis = require 'redis'
redisAuth = require 'connect-redis'
mailer = require 'nodemailer'
mime = require 'mime'
everyauth = require 'everyauth'
mongoose = require 'mongoose'
mongooseAuth = require 'mongoose-auth'
inspect = require('util').inspect
colors = require 'colors'
http = require 'http'
qs = require 'querystring'
DNode = require 'dnode'


app = express.createServer()


app.configure ->
  app.set 'views', __dirname+'/views'
  app.set 'view engine', 'ejs'
  app.use express.logger ':date -!- :remote-addr - :method :url :status -!- :user-agent'
  #app.use connect.responseTime()  # this doesn't work for some reason
  app.use express.bodyParser() # req.body
  app.use express.cookieParser() # req.cookies
  app.use express.methodOverride() # post _method access
  app.use express.session({
    ###
    store: new redisAuth({
      maxAge: 24*60*60*1000 # one day
      db: 11
    })
    ###
    secret: 'testing' # CHANGE THIS
  })
  ###
  app.use mongooseAuth.middleware()
  ###
  app.use app.router
  
app.configure 'development', ->
  app.use connect.static __dirname+'/static', { maxAge: 0 }
  app.use(express.errorHandler({ showStack: true, dumpExceptions: true }));
  
app.configure 'production', ->
  app.use connect.static __dirname+'/static', { maxAge: 31557600000 }  
  app.use(express.errorHandler());

app.listen 3020
console.log 'Express listening on port 3020'.green

# dynamic helpers
# mongooseAuth.helpExpress app
app.dynamicHelpers({
  flash: (req,res) ->
    flash = req.flash()
})

app.get '/', (req,res) ->
  res.render 'index'
    
apikey = require './api'
host = 'openstates.sunlightlabs.com'
path = '/api/v1/'

sunopt = {
  options:
    host: 'openstates.sunlightlabs.com'
    port: 80
    path: '/api/v1/'
  type: '' # metadata, bills, legislators, committee, events
  params:
    apikey: apikey
}

dnode = DNode {
  sun: (type, params, callback) ->
    type = type || {}
    options = sunopt.options || {}
    params = params || {}
    callback = if typeof callback is 'function' then callback else ->
    params.apikey = apikey
    query = '?'+qs.stringify params
    options.path = '/api/v1/'+type+query
    console.log 'Query: '.green, options.path.green
    http.get options, (res) ->
      data = ''
      res.on 'data', (chunk) ->
        console.log '> '+Buffer.byteLength(chunk+'', 'utf8')+' bytes'.green
        data = data+chunk
      res.on 'end', ->
        console.log '< '.green, Buffer.byteLength(data, 'utf8')+' bytes'.yellow
        callback null, data
      res.on 'error', (error) ->
        console.log 'Error: '+error.green
        callback error
}

dnode.listen app
  
