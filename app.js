var express= require('express');
var path= require('path');
var logger= require('morgan');
var cookieParser= require('cookie-parser');
var bodyParser= require('body-parser');
var neo4j = require('neo4j-driver');
const { match } = require('assert');
const { emitWarning } = require('process');
const res = require('express/lib/response');
const { query } = require('express');


var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j','123'));
var session = driver.session();



app.get('/',function(req,res){
  
  
   
    session
        .run("Match(n:Customer) return n")
        
        .then(function(result){
            
            var custArray=[];
             result.records.forEach(function(record){
                // console.log(record._fields[0]);
                custArray.push({
                    id:record._fields[0].identity.low,
                    first_name:record._fields[0].properties.first_name,
                    last_name: record._fields[0].properties.last_name
                });
            });
         
       
            session
                .run("Match(n:Cars) return n")
                .then(function(result2){
                    var carArr=[];
                    result2.records.forEach(function(record){
                        carArr.push(record._fields[0].properties);
                    });
                    res.render('index',{
                        customer: custArray,
                        car: carArr
                    })

                });
               
                
        })
                .catch(function(err){
                    console.log(err);
                });
    
})

app.post('/customer/add',function(req,res){
    var first_name= req.body.first_name; 
    var last_name= req.body.last_name;
    
    
    session
        .run("create (n:Customer {first_name:$first, last_name:$last}) Return n.first_name",{first: first_name, last: last_name})
        .then(function(result){
            res.redirect('/');
            

        })
        .catch(function(error){
            console.log(error);
        });


})
async function  getReviews(){
// var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j','123'));
var last_name = 'Ange';
var session = driver.session();
const query = await session.run(`Match(n:Customer{last_name:'${last_name}'})-[r:REVIEWED]->(m:Cars) WHERE r.r_comfort >= 3 and r.r_condition >= 3 and r.r_mileage >= 1 return Distinct m.car_make`)
console.log(query.records.forEach((record)=>{
console.log(record._fields.car_make)
}))

}


app.get('/review', async (req, res) => {
    
    

   await getReviews() // Right here


  })



//recommend
// app.post('/customer/recommend', function(req,res){
//     var last_name= req.body.last_name;
//     var carModelARR=[];
//     session 
//         .run("MATCH (n:Customer {last_name:$lastParam})-[r:REVIEWED]->(m:Cars) WHERE r.r_comfort > 3 and r.r_condition > 3 and r.r_mileage > 1 RETURN DISTINCT m", {lastParam:last_name})
//         .then(function(result){
//              res.redirect('/') 
//                 })
                
// `MATCH (n:Customer {last_name:'${last_name}}')-[r:REVIEWED]->(m:Cars) WHERE r.r_comfort > 3 and r.r_condition > 3 and r.r_mileage > 1 RETURN DISTINCT m`      
// 
        
//         // res.render('index',{
//         //     carname : carModelARR
//         //     })
//             .catch(function(err){
//                 console.log(err);
//             })  
//     }
     
      


app.post('/customer/review',function(req,res){
    var last_name= req.body.last_name;
    var car_model= req.body.car_model;
    // var phone = req.body.phone;
    // var id = req.body.id;
    var review= req.body.review;
    var trip_id=req.body.trip_id;                   
    var r_comfort = req.body.r_comfort;
    var r_condition = req.body.r_condition;
    var r_mileage = req.body.r_mileage;

    session
        .run("Match(n:Customer{last_name:$last_param}),(m:Cars{car_model:$car_param}) merge (n)-[r:REVIEWED {trip_id:$tripParam, review:$revParam, r_comfort:$comfParam, r_condition:$condParam, r_mileage:$mileParam}]->(m) return r",{tripParam:trip_id, last_param:last_name,car_param:car_model,revParam: review, comfParam:r_comfort, condParam:r_condition, mileParam:r_mileage})    
    // .run("Match(n:Customer{phone:$phoneParam}),(m:Cars{}) merge (n)-[r:reviewed {review:$revParam}]->(m) return r",{phoneParam:phone,idParam:id,revParam: review})
        .then(function(result3){
            res.redirect('/');
            
        })
        .catch(function(err){
            console.log(err)
        })
})


// app.get('/customer/trip',function(req,res){
//    // var first_name= req.body.first_name;
//     var last_name= "Smerdon";
//     var trips =[];
    
    
//     session
//     .run("match(a:Customer {last_name:$last_param})-[r:REVIEWED]-(b:Cars) return r.trip_id,b.car_model",{last_param: last_name})
//     .then(function(result2){
//         var trips=[];
//         result2.records.forEach(function(record){
//             trips.push(record._fields[0].properties);
//         });
//         res.render('index',{
//             trip_id : trips
//         });

//     })
//         .catch(function(error){
//             console.log(error);
//         });


// })



//Customer route
app.get('/customer/:id', function(req,res){
    var id = req.params.id;

    session 
        .run("match(a:Customer) where id(a) = toInteger($idParam) return a", {idParam:id})
        .then(function(result){
            var last_name = result.records[0].get("last_name");

            session 
        .run("optional match (a:Customer) - [r:RENTED]-(b:Cars) where id(a) = toInteger($idParam) return b", {idParam:id})
        .then(function(result2){
            result2.records.forEach(function(record){
                if(record._fields[0] != null){
                    car_modelArr.push({
                        car_model: record._fields[0].properties.car_model,
                        car_make: record._fields[0].properties.car_make
                        });
                    }
            
            })
            session
                .run("optional match (a:Customer)-[r:REVIEWED]-(b:Cars) where id(a) = toInteger($idParam) return b", {idParam: id})
                .then(function(result3){
                    var carsArr = [];
                    result3.records.forEach(function(record){
                        if(record._fields[0] != null){
                            carsArr.push({
                    
                                car_model: record._fields[0].properties.car_model,
                                car_make: record._fields[0].properties.car_make
                            });
                        }
                    });

                    res.render('customer',{
                        Reviewed: carsArr,
                        last_Name:last_nameArr,
                        Rented:car_modelArr,
                               
                    });


                            });
                        
                            session.close();
                        })
                        .catch(function(err){
                            console.log(err);
                        });
                });

        })
app.get('/comments/:id', function(req,res){
    var id = req.params.id;

    session
        .run("match(m:Customer),(b:Cars) merge (m)-[r:REVIEW]-(b) return r", {idParam:id})

        .then(function(result){
            var commentArr = [];
        
         result.records.forEach(function(record){
            commentArr.push({
        
                comment:record._fields[0].properties.comments
            })
             });
            })
            .catch(function(err){
                console.log(err);
            })
            
            res.render('comments',{
                comment:commentArr
            });
        })
    



app.listen(3002);

console.log('server started on port 3002');

module.exports= app;