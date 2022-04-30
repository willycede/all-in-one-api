exports.success = function(req,res, data, status){
    if (data.created_at) {
        delete data.created_at;
    }
    if (data.updated_at) {
        delete data.updated_at;
    }
    res.status(status||200).send({error:'', data})
}

exports.error=function(req,res, data, status){
    res.status(status||500).send({error:data, data:{}})
}