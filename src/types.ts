import type { AisleCode, DifficultyCode } from './domain/catalog';
export type TabKey = 'planning' | 'recipes' | 'shopping' | 'household';

export type Household = {
  id: string;
  name: string;
  role: 'admin' | 'member';
  setup_completed?: boolean;
  default_party_size?: number | null;
  delivery_address?: string | null;
};

export type HouseholdMember = {
  user_id: string;
  role: 'admin' | 'member';
  display_name: string;
  avatar_url?: string | null;
  avatar_path?: string | null;
  allergies: string[];
  diets: string[];
  disliked_foods: string[];
  allergy_keys?: string[];
  diet_keys?: string[];
  disliked_ingredient_keys?: string[];
};


export type MemberAbsence = {
  id: string;
  household_id: string;
  user_id: string;
  absence_date: string;
  meal_type: MealType;
  created_by?: string | null;
  created_at?: string;
};

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealMode = 'fresh' | 'leftover';

export type MealGuest = { id?: string; name: string };

export type MealSlot = {
  id: string;
  meal_date: string;
  meal_type: MealType;
  title: string;
  recipe_id?: string | null;
  cook?: string | null;
  cook_user_id?: string | null;
  participant_user_ids?: string[];
  guests?: MealGuest[];
  servings?: number | null;
  notes?: string | null;
  meal_mode?: MealMode;
  leftover_from_meal_id?: string | null;
};

export type RecipeIngredient = {
  id?: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  aisle?: AisleCode | null;
  ingredient_key?: string | null;
};

export type Recipe = {
  id: string;
  title: string;
  prep_minutes: number;
  cook_minutes: number;
  portions: number;
  tags: string[];
  photo_url?: string | null;
  source_url?: string | null;
  source_language?: string | null;
  difficulty?: DifficultyCode;
  favorite?: boolean;
  steps?: string[];
  ingredients?: RecipeIngredient[];
};


export type RecipeReaction = 'again' | 'ok' | 'skip';
export type RecipeTasteCounts = { again:number; ok:number; skip:number; total:number };
export type RecipeTasteSummary = {
  recipe_id:string;
  my_reaction:RecipeReaction|null;
  counts:RecipeTasteCounts;
};

export type PantryItem = {
  id: string;
  household_id: string;
  label: string;
  ingredient_key?: string | null;
  quantity?: number | null;
  unit?: string | null;
  aisle: AisleCode;
  expires_on?: string | null;
  updated_at?: string;
};


export type ShoppingResponsibility = {
  household_id: string;
  week_start: string;
  assigned_user_id?: string | null;
  updated_by?: string | null;
  updated_at?: string;
};

export type ShoppingItem = {
  id: string;
  household_id?: string;
  label: string;
  quantity?: number | null;
  unit?: string | null;
  aisle: AisleCode;
  checked: boolean;
  week_start?: string;
  source?: 'manual' | 'meal_plan' | 'recipe';
  ingredient_key?: string | null;
};

export type MealIdea = {
  id: string;
  household_id: string;
  title: string;
  recipe_id?: string | null;
  proposed_by?: string | null;
  proposer_name?: string | null;
  vote_count: number;
  voted_by_me: boolean;
  created_at?: string;
};

export type ActivityEventType='meal_updated'|'meal_deleted'|'shopping_checked'|'shopping_unchecked'|'recipe_added'|'meal_idea_added';
export type HouseholdActivity={
  id:string;
  household_id:string;
  actor_user_id?:string|null;
  actor_name?:string|null;
  event_type:ActivityEventType;
  details:Record<string,unknown>;
  created_at:string;
};
