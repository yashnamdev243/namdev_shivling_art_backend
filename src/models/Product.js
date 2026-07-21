const {DataTypes}=require('sequelize');
const sequelize=require('../config/database');
module.exports=sequelize.define('Product',{
title:{type:DataTypes.STRING,allowNull:false},
category:DataTypes.STRING,
description:DataTypes.TEXT,
price:DataTypes.DECIMAL(10,2),
image:DataTypes.STRING
},{tableName:'products'});