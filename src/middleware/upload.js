const multer=require('multer');
const storage=multer.diskStorage({destination:'src/uploads/products',filename:(r,f,cb)=>cb(null,Date.now()+'-'+f.originalname)});
module.exports=multer({storage});