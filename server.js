var express = require('express');
var app=express();
var mongo = require('mongodb').MongoClient;
  
var dburl =process.env.MONGOURI || 'mongodb://localhost:27017/url-shortner';


mongo.connect(dburl, function(err, db) {
    if(err) throw err;
     
    
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.get('/',function(req,res){
        res.render('index');
    });
    
    //check short url and redirect
    app.get('/:urlid',function(req,res){
        var urlId=+req.params.urlid;
        
        if (urlId>0)
        {
            //find url corresponding to id passed
            db.collection('urls')
                .findOne(
                    {id:urlId},
                    function(err,doc)
                    {
                        if (err) throw err;
                        //redirect to url found
                        if (doc)
                        {
                            res.redirect(doc.url);
                        }
                        else
                        {
                           res.status(404).send('resource not found');
                        }
                        
                    });
        }
        else
        {
            res.status(404).send('resource not found');
        }
    })
    
    //shorten and save user's long url
    app.get('/new/*', function(req, res){
        var url = req.params[0];
        //validate input url
        if(validateUrl(url))
         {
             //get url collection from db
            var col= db.collection('urls');
            
            //init short url
            var short_url=req.headers['x-forwarded-proto'] + '://' + req.headers['host'] + '/'
            
            //count number of records
            col.count({},function(err, count){
                if(err) throw err;
                var newId=count+1;
                //use count+1 as id and insert the longurl
                col.insert({id:newId, url:url});
                
                //construct short url using the counter
                short_url=short_url + newId;
               
                //console.log(newId);
                //return short url along with long url that user passed
                 res.json( {short_url:short_url,original_url:url});
            });
                         
         
         }
        else
        {
            res.status(400).json({error:'invalid url - ' + url});
        }
    });
});
 
 
function validateUrl(url)
{
    return url.match(/(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/);
}

app.listen(process.env.PORT, function(){
    console.log('listening');
});