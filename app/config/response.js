exports.success = function(req,res, data, status){
    res.status(status||200).send({error:'', data})
}

exports.error=function(req,res, data, status){
    res.status(status||500).send({error:data, data:{}})
}