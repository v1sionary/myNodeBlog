var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    md5 = require('md5'),
    passport = require('passport'),
    tool = require('../../common/tool'),
    UserServ = require('../../service/userService');

module.exports = function (app) {
    app.use('/admin/users', router);
};

router.get('/login', function (req, res, next) {
    res.render('login', {
        pretty: true,
        title: '登录'
    });
});

router.post('/login',
    passport.authenticate('local', {failureRedirect: '/admin/users/login'}),
    function (req, res, next) {
        res.redirect('/admin/posts');
    }
);

router.get('/modifyPassword',
    tool.requireLogin,
    function (req, res, next) {
        res.render('admin/user/modifyPassword', {
            title: '修改密码'
        });
    });

router.post('/modifyPassword',
    tool.requireLogin,
    getById,
    function (req, res, next) {

        var user = req.user;
        var oldPassword = req.body.password,
            newPassword = req.body.newPassword;

        //表单验证
        req.checkBody('password', '请输入旧密码').notEmpty();
        req.checkBody('newPassword', '请输入新密码').notEmpty();

        var errors = req.validationErrors();
        if (user.password !== md5(oldPassword)) {
            if (!errors && !errors.length) {
                errors = [];
            }
            errors.unshift({param: 'password', msg: '旧密码不正确', value: oldPassword});
        }
        if (errors) {
            return res.render('admin/user/modifyPassword', {
                title: '修改密码',
                formInvalids: errors,
                password: oldPassword,
                newPassword: newPassword
            });
        }

        user.password = md5(newPassword);

        user.save(function (err, user) {
            if (err) {
                console.log('user/modifyPassword error:', err);
                req.flash('error', '密码修改失败');
                res.render('admin/user/modifyPassword', {
                    title: '修改密码',
                    password: oldPassword,
                    newPassword: newPassword
                });
            } else {
                req.flash('success', '密码修改成功');
                res.redirect('/admin/users/modifyPassword');
            }
        });
    }
);

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/admin/users/login');
});


function getById(req, res, next) {
    //user id 从params传进或者从session中获取
    var _userId = req.params.id || (req.sessionUser && req.sessionUser._id);

    if (!_userId) {
        return next(new Error('no user id provided'));
    }

    UserServ.getUserById(_userId, function (err, user) {
        if (err)return next(err);
        if (!user)return next(new Error('user not found'));

        req.user = user;
        next();
    });
}
