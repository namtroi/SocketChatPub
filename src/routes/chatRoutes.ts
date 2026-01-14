import { Router } from 'express';
import { createGroup, sendMessage, getHistory, getGroups } from '../controllers/chatController';



const router = Router();

router.post('/group', createGroup);
router.get('/groups', getGroups);  // List groups for a user
router.post('/message', sendMessage);
router.get('/history', getHistory);

export default router;


