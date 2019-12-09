import * as yup from 'yup'

import errorUtils from '../../utils/error'
import authUtils from '../../utils/auth'

const createPost = {
  validationSchema: yup.object().shape({
    data: yup.object().shape({
      title: yup
        .string()
        .trim()
        .required('Title is a required field.')
        .min(5, 'Title should at least be 5 characters.')
        .max(100, 'Title should be 100 characters at most.'),
      body: yup
        .string()
        .trim()
        .required('Body is a required field.')
        .min(5, 'Body should at least be 5 characters.'),
      published: yup.boolean()
    })
  }),
  resolve: async (parent, { data }, { request, postService, userService, logger, pubsub }) => {
    const author = await authUtils.getUser(request)
    const userExists = (await userService.count({ where: { id: author } })) >= 1

    logger.info('PostMutation#createPost.check', !userExists)

    if (!userExists) {
      return errorUtils.buildError(['User not found'])
    }

    const post = await postService.create({
      ...data,
      author
    })

    if (data.published) {
      pubsub.publish('post', {
        post: {
          mutation: 'CREATED',
          data: post
        }
      })
    }

    return { post }
  }
}

export default { createPost }
