import { Router } from 'express';
import { requireStaff, getStaff } from '../../middlewares/staff';
import { created, ok } from '../../utils/apiResponse';
import { bodyOf } from '../../utils/zod';
import { audit } from '../../services/audit.service';
import {
  createHeroSlideSchema,
  updateHeroSlideSchema,
  heroSlideToggleSchema,
} from './hero-slide.schemas';
import {
  listHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  setHeroSlideActive,
  deleteHeroSlide,
} from './hero-slide.service';

/** Public route: GET /api/v1/hero-slides (Active slides for homepage carousel) */
export const publicHeroSlideRouter = Router();

publicHeroSlideRouter.get('/', async (_req, res) => {
  const slides = await listHeroSlides(true);
  ok(res, slides);
});

/** Admin routes: /api/v1/admin/hero-slides */
export const adminHeroSlideRouter = Router();
const staffOnly = requireStaff({ admin: true, sub_admin: true });

adminHeroSlideRouter.get('/', staffOnly, async (_req, res) => {
  const slides = await listHeroSlides(false);
  ok(res, slides);
});

adminHeroSlideRouter.post('/', staffOnly, async (req, res) => {
  const staff = getStaff(req);
  const input = createHeroSlideSchema.parse(bodyOf(req));
  const slide = await createHeroSlide(input);

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'CREATE_HERO_SLIDE',
    targetEntity: 'HeroSlide',
    targetId: slide.id,
    newState: slide,
    req,
  });

  created(res, slide);
});

adminHeroSlideRouter.put('/:id', staffOnly, async (req, res) => {
  const staff = getStaff(req);
  const id = String(req.params.id);
  const input = updateHeroSlideSchema.parse(bodyOf(req));
  const slide = await updateHeroSlide(id, input);

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'UPDATE_HERO_SLIDE',
    targetEntity: 'HeroSlide',
    targetId: id,
    newState: slide,
    req,
  });

  ok(res, slide);
});

adminHeroSlideRouter.patch('/:id/active', staffOnly, async (req, res) => {
  const staff = getStaff(req);
  const id = String(req.params.id);
  const { isActive } = heroSlideToggleSchema.parse(bodyOf(req));
  const slide = await setHeroSlideActive(id, isActive);

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'TOGGLE_HERO_SLIDE',
    targetEntity: 'HeroSlide',
    targetId: id,
    newState: { isActive },
    req,
  });

  ok(res, slide);
});

adminHeroSlideRouter.delete('/:id', staffOnly, async (req, res) => {
  const staff = getStaff(req);
  const id = String(req.params.id);
  const success = await deleteHeroSlide(id);

  await audit({
    actor: { id: staff.id, role: staff.role },
    action: 'DELETE_HERO_SLIDE',
    targetEntity: 'HeroSlide',
    targetId: id,
    req,
  });

  ok(res, { success });
});
