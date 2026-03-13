import singleRepoController from '../controllers/singleRepo.controller.js'
import allRepoController from '../controllers/allRepo.controller.js'
import newRepoController from '../controllers/newRepo.controller.js'
import authenticateToken from '../middleware/authenticateToken.js'
import profilePinnedRepoController from '../controllers/profile.pinnedRepository.controller.js'
import getFileTreeController from '../controllers/tree.controller.js'
import deleteRepoController from '../controllers/deleteRepo.controller.js'
import updateRepoController from '../controllers/updateRepo.controller.js'
import updateRepoValidator from '../validators/updateRepo.validator.js'
import starredReposController from '../controllers/starredRepos.controller.js'
import searchRepositoryController from '../controllers/searchRepository.controller.js'
import express from "express"

const router = express.Router()

router.post(
    "/new",
    authenticateToken,
    newRepoController
)

router.post(
    "/all",
    authenticateToken,
    allRepoController
)

router.get(
    "/starred",
    authenticateToken,
    starredReposController
)

router.get(
    "/search",
    searchRepositoryController
)

router.get(
    "/:userName/:repoName",
    authenticateToken,
    singleRepoController
)

router.get(
    "/pinned",
    authenticateToken,
    profilePinnedRepoController
)

router.get(
    "/:userName/:repoName/tree",
    authenticateToken,
    getFileTreeController
)

router.delete(
    "/:userName/:repoName",
    authenticateToken,
    deleteRepoController
)

router.patch(
    "/:userName/:repoName",
    authenticateToken,
    updateRepoValidator,
    updateRepoController
)

export default router