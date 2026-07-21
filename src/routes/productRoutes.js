const r=require('express').Router();const c=require('../controllers/productController');const up=require('../middleware/upload');
r.post('/',up.single('image'),c.create);
r.get('/',c.getAll);
r.get('/:id',c.getOne);
r.put('/:id',up.single('image'),c.update);
r.delete('/:id',c.remove);
module.exports=r;