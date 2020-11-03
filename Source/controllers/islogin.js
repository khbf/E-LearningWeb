let controller = {}
controller.isLoggendIn = (req, res, next) => {
    if (req.session.user) {
        if (req.session.isAdmin) {
            return res.redirect('/admin')
        }
        next();
    } else {
        res.redirect('/login')
    }
};
controller.kt_page_login_registe = (req, res, next) => {
    if (!req.session.user) {
        next();
    } else {
        res.redirect('/')
    }
};
controller.isLoggend_Admin = (req, res, next) => {
    if (req.session.user) {
        if (req.session.isAdmin) {
            next();
        } else {
            res.status(500).send('Access Denied');
        }
    } else {
        res.redirect('/login')
    }
};
module.exports = controller;
