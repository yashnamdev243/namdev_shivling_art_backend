const Product=require('../models/Product');
exports.create=async(req,res)=>{const p=await Product.create({...req.body,image:req.file?req.file.filename:null});res.json(p);}
exports.getAll=async(req,res)=>res.json(await Product.findAll());
exports.getOne=async(req,res)=>res.json(await Product.findByPk(req.params.id));
exports.update=async(req,res)=>{const p=await Product.findByPk(req.params.id);if(!p)return res.sendStatus(404);await p.update({...req.body,image:req.file?req.file.filename:p.image});res.json(p);}
exports.remove=async(req,res)=>{const p=await Product.findByPk(req.params.id);if(!p)return res.sendStatus(404);await p.destroy();res.json({message:'Deleted'});}
