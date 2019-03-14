import express from 'express';
import UserController from '../controllers/user';
import passport from '../auth/passport';
import ProfileController from '../controllers/profile';
import isUserVerified from '../middleware/verifyUser';
import Auth from '../middleware/auth';
import addImages from '../middleware/addImage';
import generateSlug from '../middleware/generateSlug';
import ArticleController from '../controllers/articles';
import CategoryController from '../controllers/category';
import {
  validateSignup,
  validateLogin,
  validateProfileChange,
  validateEmail,
  validatePassword,
  validateArticle,
  returnValidationErrors,
  validateCategory,
  validateSearch,
  validateArticleExist,
  validateCreateComment,
  validateEditComment,
  validateCommentUser,
  validateUser,
  validateArticleId,
  validateArticleRating
} from '../middleware/validation';
import CommentController from '../controllers/comment';


const { createArticle, updateArticle, deleteArticle, rateArticle } = ArticleController;

const apiRoutes = express.Router();

apiRoutes.route('/user/signup')
  .post(validateSignup, returnValidationErrors, UserController.registerUser);

apiRoutes.route('/userprofile')
  .get(Auth.verifyUser, isUserVerified, ProfileController.viewProfile)
  .patch(Auth.verifyUser, isUserVerified, validateProfileChange,
    returnValidationErrors, ProfileController.editProfile);

apiRoutes.route('/verify/:verificationId')
  .get(UserController.verifyAccount);

apiRoutes.route('/articles')
  .post(
    Auth.verifyUser, isUserVerified,
    addImages,
    validateArticle,
    returnValidationErrors,
    generateSlug,
    createArticle
  );

apiRoutes.route('/articles/:id')
  .put(
    Auth.verifyUser, isUserVerified,
    validateUser,
    addImages,
    validateArticle,
    returnValidationErrors,
    generateSlug,
    updateArticle
  );

apiRoutes.route('/articles/:id')
  .delete(
    Auth.verifyUser, isUserVerified,
    validateUser,
    deleteArticle
  );

apiRoutes.route('/articles/rate/:articleId')
  .post(Auth.verifyUser, isUserVerified, validateArticleId,
    validateArticleRating, returnValidationErrors, rateArticle);

apiRoutes.get('/auth/google',
  passport.authenticate(
    'google', {
      scope: ['email', 'profile']
    }
  ));

apiRoutes.get('/auth/google/callback',
  passport.authenticate(
    'google', { failureRedirect: '/login' }
  ),
  (req, res) => {
    res.redirect('/');
  });

apiRoutes.get('/auth/facebook',
  passport.authenticate(
    'facebook', {
      scope: ['email']
    }
  ));

apiRoutes.get('/auth/facebook/callback',
  passport.authenticate(
    'facebook', { failureRedirect: '/login' }
  ),
  (req, res) => {
    res.redirect('/');
  });

apiRoutes.post(
  '/user/login',
  validateLogin,
  returnValidationErrors,
  isUserVerified,
  UserController.loginUser
);

apiRoutes.get(
  '/articles/search',
  validateSearch,
  returnValidationErrors,
  ArticleController.searchForArticles,
);

apiRoutes.get(
  '/articles/:slug',
  ArticleController.getArticleBySlug,
);

apiRoutes.route('/category')
  .post(
    Auth.verifyUser,
    isUserVerified,
    validateCategory,
    returnValidationErrors,
    CategoryController.addNew
  );


apiRoutes.post(
  '/requestpasswordreset',
  validateEmail,
  returnValidationErrors,
  isUserVerified,
  UserController.requestPasswordReset,
);

apiRoutes.post(
  '/resetpassword/:passwordResetToken',
  validatePassword,
  returnValidationErrors,
  UserController.resetPassword
);
apiRoutes.route('/comment/:id')
  .post(Auth.verifyUser,
    isUserVerified,
    validateArticleExist,
    validateCreateComment,
    returnValidationErrors,
    CommentController.createComment)
  .patch(Auth.verifyUser,
    isUserVerified,
    validateCommentUser,
    validateEditComment,
    returnValidationErrors,
    CommentController.editComment)
  .delete(Auth.verifyUser,
    isUserVerified,
    validateCommentUser,
    returnValidationErrors,
    CommentController.deleteComment);


export default apiRoutes;
