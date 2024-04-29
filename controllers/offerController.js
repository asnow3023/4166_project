const ObjectID = require('mongodb');
const model = require('../models/offer');
const itemModel = require('../models/item');
const userModel = require('../models/user');

//post new offers and update item offer quantity
exports.new = (req, res, next) => {
    let offer = new model(req.body);
    let itemId = req.params.id;

    //update offer model with user and item id, user's name and item's title
    offer.userId = req.session.user;
    offer.itemId = req.params.id;
    
    itemModel.findById(itemId)
    .then((item) => {
        if(item){
            //update item document
            return itemModel.updateOne(
                {_id: itemId},
                {
                    $max: {highestOffer: offer.amount},
                    $inc: {totalOffers: 1}
                }
            )
        }
        else{
            let err = new Error('Item not Found!');
            err.status = 404;
            next(err);
        }
    })
    .then((updatedResult) => {
        //save offer as a document after update is successfully implemented
        if(updatedResult.modifiedCount > 0) {
            return offer.save();
        } else{
            next(err);  
        }
    })
    .then(() => {
        //redirect to the item details view
        req.flash('success',  'Offer posted successfully');
        res.redirect('/items/' + itemId);
    })
    .catch((err) => {
        if(err.name === 'ValidationError') {
            err.status = 400;
            req.flash('error',  'Error posting offer to the item');
        }
        next(err);
    })
}


//view all offers for the item
exports.view = (req, res, next) => {
    let itemId = req.params.id

    itemModel.findById(itemId)
    .then((item) => {
        if(item){
            model.find({itemId:itemId})
            .then((offers) => {

            const promises = [];

            offers.forEach((offer) => {
                const promise = userModel.findById(offer.userId)
                .then((foundUser) => {
                    offer.username = String(foundUser.firstName + " " +  foundUser.lastName);
                })
                .catch((err) => {
                    next(err);
                });

                //push to promises
                promises.push(promise);
            });
            Promise.all(promises)
                    .then(() => {
                        //sends the list of items and offers to a newly rendered profile page
                        res.render('../views/offers/offer', { cssFile: '/styles/offer.css', item, offers}); 
                    })
                    .catch(err=>next(err))
            })      
        }
    })
    .catch(err=>next(err))
    
}

//accept offer
exports.accept = (req, res, next) => {

}