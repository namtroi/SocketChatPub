import { Router } from 'express';
import { createGroup, sendMessage, getHistory } from '../controllers/chatController';



const router = Router();

router.post('/group', createGroup);
router.post('/message', sendMessage);
router.get('/history', getHistory);

export default router;


