import db, {
  Article,
  User,
  Ratings,
  Comment,
  Category
} from '../models';
import Paginate from '../helpers/paginate';

/**
 * @class ArticleController
 * @override
 * @export
 */
export default class ArticleController {
  /**
 * @description - Create a new article
 * @static
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @memberof ArticleController
 * @returns {Object} class instance
 */
  static async createArticle(req, res) {
    const images = req.images || [];
    const {
      title, description, body, slug, categoryId
    } = req.body;
    const taglist = req.body.taglist ? req.body.taglist.split(',') : [];
    const { id } = req.user;
    try {
      const result = await Article.create({
        title,
        description,
        body,
        slug,
        images,
        taglist,
        userId: id,
        categoryId: categoryId || 1
      });
      return res.status(201).json({
        success: true,
        message: 'New article created successfully',
        article: result,
      });
    } catch (error) {
      return res.status(500).json({ success: false, errors: [error.message] });
    }
  }

  /**
 * @description - Rate an article
 * @static
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @memberof ArticleController
 * @returns {Object} class instance
 */
  static async rateArticle(req, res) {
    const { id } = req.user;
    const rating = Number(req.body.rating);
    const { articleId } = req.params;
    try {
      const previousRating = await Ratings.findOne({ where: { userId: id, articleId } });
      if (previousRating) {
        const updatedRating = await previousRating.update({ rating });
        return res.status(201).json({
          success: true,
          message: `Article rating has been updated as ${rating}`,
          rating: updatedRating
        });
      }
      return res.status(200).json({
        success: true,
        message: `Article has been rated as ${rating}`,
        articleRating: (await Ratings.create({
          userId: id,
          articleId,
          rating
        }))
      });
    } catch (error) {
      return res.status(400).json({ success: false, errors: ['Error rating this article'] });
    }
  }

  /**
 * @description - Update an article
 * @static
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @memberof ArticleController
 * @returns {Object} class instance
 */
  static async updateArticle(req, res) {
    const images = req.images || [];
    const {
      title, description, body
    } = req.body;

    const {
      params: { slug }
    } = req;
    try {
      const result = await Article.update({
        title,
        description,
        body,
        images
      }, {
        where: {
          slug
        }
      });
      return res.status(200).json({
        success: true,
        message: 'Article updated successfully',
        article: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        errors: [error.message]
      });
    }
  }

  /**
 * @description - Deletes an article
 * @static
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @memberof ArticleController
 * @returns {Object} class instance
 */
  static async deleteArticle(req, res) {
    try {
      await Article.destroy({
        where: {
          slug: req.params.slug
        }
      });
      return res.status(200).json({
        success: true,
        message: 'Article deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        errors: [error.message]
      });
    }
  }

  /**
   * @description - Search for articles
   * @static
   * @param {Object} req - the request object
   * @param {Object} res - the response object
   * @memberof ArticleController
   * @returns {Object} class instance
   */
  static async searchForArticles(req, res) {
    try {
      let { offset, limit } = req.query;
      offset = Number(offset) || 0;
      limit = Number(limit) || 10;
      const searchTerms = ArticleController.generateSearchQuery(req.query);
      const results = await Article.findAndCountAll({
        where: {
          ...searchTerms,
        },
        include: [{
          model: User,
          attributes: ['username', 'email', 'name', 'bio'],
          as: 'author',
        }],
        offset,
        limit,
      });
      const { count } = results;
      const meta = Paginate({ count, limit, offset });
      return res.status(200).json({
        results,
        ...meta,
        success: true
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        errors: ['Oops, something went wrong.']
      });
    }
  }

  /**
   * @description - Generate queries for search and filter
   * @static
   * @param {Object}  searchTerms - the terms that the user wants to search for
   * @memberof ArticleController
   * @returns {Object} class instance
   */
  static generateSearchQuery(searchTerms) {
    const {
      author, term, endDate, startDate, tags, categoryId
    } = searchTerms;

    const filterFields = {
      '$author.username$': {
        $like: `%${author}%`
      },
      createdAt: {
        $between: [startDate, endDate]
      },
      title: {
        $like: `%${term}%`,
      },
      description: {
        $like: `%${term}%`,
      },
      taglist: {
        $contains: tags ? [...tags.split(',')] : []
      },
      categoryId: Number(categoryId),
    };

    if (!author) {
      delete filterFields['$author.username$'];
    }
    if (!startDate || !endDate) {
      delete filterFields.createdAt;
    }
    if (!categoryId) {
      delete filterFields.categoryId;
    }
    return filterFields;
  }

  /**
   * @description - Get article by slug
   * @static
   * @param {Object} req - the request object
   * @param {Object} res - the response object
   * @memberof ArticleController
   * @returns {Object} class instance
   */
  static async getArticleBySlug(req, res) {
    try {
      const {
        params: {
          slug
        }
      } = req;
      const article = await Article.findOne({
        where: {
          slug
        },
        include: [
          {
            as: 'author',
            model: User,
            attributes: ['username', 'email', 'name', 'bio'],
          },
          {
            model: Ratings,
          },
          {
            model: Comment,
          }
        ]
      });
      return res.status(200).json({
        success: true,
        article: article.dataValues
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        errors: ['Article not found.'],
      });
    }
  }

  /**
 * @description - Get all articles
 * @static
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @memberof ArticleController
 * @returns {Object} class instance
 */
  static async getAllArticles(req, res) {
    try {
      let {
        query: {
          offset, limit
        }
      } = req;
      offset = Number(offset) || 0;
      limit = Number(limit) || 10;
      const results = await Article.findAndCountAll({
        where: {},
        offset,
        limit,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['username', 'bio', 'name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['categoryName']
          },
          {
            model: Ratings,
          }
        ]
      });
      const { count } = results;
      const meta = Paginate({ count, limit, offset });
      return res.status(200).json({
        success: true,
        results,
        ...meta
      });
    } catch (error) {
      return res.status(500).json({
        succes: false,
        errors: ['Oops, something wrong occured.']
      });
    }
  }

  /**
  * @description - Generate query for request to get articles with order
  * @static
  * @param {Object} type - type of order
  * @param {Object} amount - amount of articles to get
  * @memberof ArticleController
  * @returns {Object} order for findAll
  */
  static getQuery(type, amount) {
    const orders = {
      ratings:
      `
        SELECT "Articles".*, ROUND(AVG("Ratings".rating), 1) AS avg_rating
        FROM "Ratings"
        JOIN "Articles" ON "Ratings"."articleId" = "Articles".id
        GROUP BY "Articles".id, "Articles".slug
        ORDER BY avg_rating DESC
        LIMIT ${Number(amount) || 5}
      `,
      latest:
      `
        SELECT *
        FROM "Articles"
        ORDER BY "Articles"."createdAt" DESC
        LIMIT ${Number(amount) || 5}
      `,
      comments:
      `
        SELECT "Articles".*, COUNT("Comments".comment) AS comment_count
        FROM "Comments"
        JOIN "Articles" ON "Comments"."articleSlug" = "Articles".slug
        GROUP BY "Articles".id, "Articles".slug
        ORDER BY comment_count DESC
        LIMIT ${Number(amount) || 5}
      `
    };
    return orders[type];
  }

  /**
  * @description - Get a specific number of articles with criteria
  * @static
  * @param {Object} req - the request object
  * @param {Object} res - the response object
  * @memberof ArticleController
  * @returns {Object} class instance
  */
  static async getArticlesByHighestField(req, res) {
    const {
      query: {
        amount, type
      }
    } = req;
    const query = ArticleController.getQuery(type, amount);
    const [, articles] = await db.sequelize.query(
      query,
      { raw: false }
    );
    return res.status(200).json({
      success: true,
      message: 'Articles returned successfully.',
      articles: articles.rows
    });
  }
}
