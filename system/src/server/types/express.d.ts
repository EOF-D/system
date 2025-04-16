export {}; // Ensure this file is treated as a module.

declare global {
  namespace Express {
    interface Request {
      /**
       * The user object is added to the request object after authentication.
       * @type {Object}
       */
      user?: {
        /**
         * The ID of the user.
         * @type {number}
         */
        id: number;

        /**
         * The username of the user.
         * @type {string}
         */
        role: string;

        [key: string]: any;
      };
    }
  }
}
