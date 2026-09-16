import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { importRecipeFromUrl } from '../lib/recipeImport';
import { importRecipeFromPhoto } from '../lib/photoRecipeImport';
import { localIsoDate } from '../lib/dates';
import { addRecipeIngredientsToCachedShopping, addRecipeToShopping } from '../services/shopping';
import { createRecipe, fetchRecipes, RecipeDraft, setRecipeFavorite } from '../services/recipes';
import { colors, radius } from '../theme';
import { Recipe, RecipeIngredient } from '../types';
import { AccessState, hasFamilyAccess } from '../services/subscription';
import { PaywallScreen } from './PaywallScreen';
import { CookingModeScreen } from './CookingModeScreen';
import {
  AisleCode,
  DifficultyCode,
  normalizeAisle,
  normalizeUnit,
  UnitCode,
} from '../domain/catalog';
import { useLocale } from '../context/LocaleContext';
import { asAppError } from '../lib/appError';
import { RecipeTasteCard } from '../components/RecipeTasteCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { EmptyState } from '../components/EmptyState';
import { fetchRecipeTranslation, RecipeTranslationView, translatedIngredients } from '../services/recipeTranslations';
import { classifyPremiumGateError } from '../lib/premiumGate';

const demo: Recipe[] = [
  {
    id: 'r1',
    title: 'Lasagnes maison',
    prep_minutes: 25,
    cook_minutes: 40,
    portions: 4,
    tags: ['Famille'],
    difficulty: 'medium',
    favorite: true,
    source_language: 'fr',
    ingredients: [
      { name: 'Pâtes à lasagnes', quantity: 1, unit: 'pack', aisle: 'pantry' },
      { name: 'Mozzarella', quantity: 2, unit: 'ball', aisle: 'fresh' },
    ],
    steps: ['Préparer la sauce.', 'Monter les couches.', 'Cuire 40 minutes.'],
  },
  {
    id: 'r2',
    title: 'Saumon & légumes',
    prep_minutes: 15,
    cook_minutes: 20,
    portions: 4,
    tags: ['Rapide'],
    difficulty: 'easy',
    favorite: false,
    source_language: 'fr',
    ingredients: [
      { name: 'Saumon', quantity: 600, unit: 'g', aisle: 'fresh' },
      { name: 'Courgettes', quantity: 3, unit: 'piece', aisle: 'produce' },
    ],
    steps: ['Découper les légumes.', 'Cuire le saumon et les légumes.'],
  },
  {
    id: 'r3',
    title: 'Curry végétarien',
    prep_minutes: 20,
    cook_minutes: 30,
    portions: 4,
    tags: ['Végétarien'],
    difficulty: 'easy',
    favorite: true,
    source_language: 'fr',
    ingredients: [
      { name: 'Pois chiches', quantity: 2, unit: 'can', aisle: 'pantry' },
      { name: 'Lait de coco', quantity: 1, unit: 'can', aisle: 'pantry' },
    ],
    steps: ['Faire revenir les épices.', 'Ajouter les ingrédients.', 'Mijoter 30 minutes.'],
  },
];

function parseIngredients(raw: string): RecipeDraft['ingredients'] {
  return raw
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, qty, unit, aisle] = line.split('|').map((x) => x?.trim());
      const quantity = qty ? Number(qty.replace(',', '.')) : null;
      return {
        name,
        quantity: Number.isFinite(quantity as number) ? quantity : null,
        unit: normalizeUnit(unit),
        aisle: normalizeAisle(aisle),
      };
    })
    .filter((x) => x.name);
}

function ingredientText(
  items: RecipeDraft['ingredients'],
  aisleLabel: (aisle: AisleCode) => string,
): string {
  return items
    .map((x) => `${x.name} | ${x.quantity ?? ''} | ${x.unit ?? ''} | ${aisleLabel(x.aisle ?? 'other')}`)
    .join('\n');
}

const unitCodes = new Set<UnitCode>([
  'piece',
  'pack',
  'ball',
  'can',
  'box',
  'g',
  'kg',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'cup',
  'oz',
  'lb',
]);

export function RecipesScreen({
  householdId,
  demoMode = false,
  weekStart,
  access,
  onRefreshAccess,
  onStartTrial,
}: {
  householdId: string;
  demoMode?: boolean;
  weekStart: Date;
  access: AccessState;
  onRefreshAccess?: () => Promise<AccessState>;
  onStartTrial?: () => void | Promise<void>;
}) {
  const locale = useLocale();
  const textAlign = locale.textDirection === 'rtl' ? 'right' : 'left';
  const familyAccess = hasFamilyAccess(access);
  const handlePremiumRefusal=async(error:unknown)=>{
    const gate=classifyPremiumGateError(error);
    if(gate==='FAMILY_PLAN_REQUIRED'){
      try{await onRefreshAccess?.();}catch{}
      setPaywallOpen(true);
      return true;
    }
    if(gate==='FREE_RECIPE_LIMIT'){
      setError(locale.t('recipes.freeLimit'));
      return true;
    }
    return false;
  };

  const [recipes, setRecipes] = useState<Recipe[]>(demoMode ? demo : []);
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState('');
  const [cooking, setCooking] = useState<Recipe | null>(null);
  const [query, setQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | '30' | '60'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | DifficultyCode>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [translation,setTranslation]=useState<RecipeTranslationView|null>(null);

  const [editor, setEditor] = useState(false);
  const [title, setTitle] = useState('');
  const [prep, setPrep] = useState('');
  const [cook, setCook] = useState('');
  const [portions, setPortions] = useState('4');
  const [tags, setTags] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyCode>('easy');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [detailMessage, setDetailMessage] = useState('');

  const [photoImportOpen, setPhotoImportOpen] = useState(false);
  const [photoImporting, setPhotoImporting] = useState(false);
  const [photoImportError, setPhotoImportError] = useState('');
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const importInFlight=useRef(false);
  const photoImportInFlight=useRef(false);
  const favoriteInFlight=useRef<Set<string>>(new Set());
  const shoppingInFlight=useRef(false);
  const saveInFlight=useRef(false);

  const load = useCallback(async () => {
    if (demoMode) return;
    setLoading(true);
    try {
      setRecipes(await fetchRecipes(householdId));
      setError('');
    } catch {
      setError(locale.t('recipes.loadError'));
    } finally {
      setLoading(false);
    }
  }, [demoMode, householdId, locale]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(()=>{
    let active=true;
    setTranslation(null);
    if(!selected||demoMode)return()=>{active=false;};
    const source=(selected.source_language??'').toLocaleLowerCase();
    if(source&&source.startsWith(locale.language))return()=>{active=false;};
    fetchRecipeTranslation(selected,locale.language)
      .then(value=>{if(active)setTranslation(value);})
      .catch(()=>{if(active)setTranslation(null);});
    return()=>{active=false;};
  },[selected,demoMode,locale.language]);

  const selectedForDisplay=useMemo<Recipe|null>(()=>{
    if(!selected)return null;
    if(!translation)return selected;
    return {...selected,title:translation.title,ingredients:translatedIngredients(selected,translation),steps:translation.steps.length?translation.steps:selected.steps};
  },[selected,translation]);

  const availableTags = useMemo(
    () =>
      Array.from(new Set(recipes.flatMap((r) => r.tags)))
        .sort((a, b) => a.localeCompare(b, locale.languageTag))
        .slice(0, 8),
    [recipes, locale.languageTag],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale.languageTag);
    return recipes.filter((r) => {
      const hay = [r.title, ...r.tags, ...(r.ingredients ?? []).map((x) => x.name)]
        .join(' ')
        .toLocaleLowerCase(locale.languageTag);
      const total = r.prep_minutes + r.cook_minutes;
      return (
        (!q || hay.includes(q)) &&
        (timeFilter === 'all' || total <= Number(timeFilter)) &&
        (difficultyFilter === 'all' || (r.difficulty ?? 'easy') === difficultyFilter) &&
        (!tagFilter || r.tags.includes(tagFilter)) &&
        (!favoritesOnly || r.favorite)
      );
    });
  }, [recipes, query, timeFilter, difficultyFilter, tagFilter, favoritesOnly, locale.languageTag]);

  const activeFilterCount =
    (timeFilter !== 'all' ? 1 : 0) +
    (difficultyFilter !== 'all' ? 1 : 0) +
    (tagFilter ? 1 : 0);

  const clearFilters = () => {
    setTimeFilter('all');
    setDifficultyFilter('all');
    setTagFilter('');
    setFavoritesOnly(false);
    setFiltersOpen(false);
  };

  const aisleLabel = (aisle: AisleCode) => locale.t(`aisle.${aisle}` as any);

  const localizedRecipeError = (error:unknown, fallback:'recipes.importError'|'recipes.photoError') => {
    const appError=asAppError(error);
    if(!appError)return locale.t(fallback);
    const keys:Record<string,any>={
      'recipe.import.unreachable':'recipes.errorUnreachable',
      'recipe.import.refused':'recipes.errorRefused',
      'recipe.import.noStructuredRecipe':'recipes.errorNoStructured',
      'recipe.photo.noUsableTitle':'recipes.errorNoPhotoTitle',
      'recipe.photo.ocrNotConfigured':'recipes.errorOcrNotConfigured',
      'recipe.photo.prepareFailed':'recipes.errorPhotoPrepare',
      'recipe.photo.ocrUnavailable':'recipes.errorOcrUnavailable',
    };
    return locale.t(keys[appError.code]??fallback,appError.meta);
  };

  const reset = () => {
    setTitle('');
    setPrep('');
    setCook('');
    setPortions('4');
    setTags('');
    setIngredients('');
    setSteps('');
    setSourceUrl(null);
    setSourceLanguage(null);
    setPhotoUrl(null);
    setLocalPhotoPreview(null);
    setDifficulty('easy');
  };

  const openManual = () => {
    if (!familyAccess && recipes.length >= 10) {
      setPaywallOpen(true);
      return;
    }
    reset();
    setEditor(true);
  };

  const openUrlImport = () => {
    if (!familyAccess) {
      setPaywallOpen(true);
      return;
    }
    setImportError('');
    setImportOpen(true);
  };

  const openPhotoImport = () => {
    if (!familyAccess) {
      setPaywallOpen(true);
      return;
    }
    setPhotoImportError('');
    setPhotoImportOpen(true);
  };

  const applyImportedDraft = (draft: RecipeDraft) => {
    setTitle(draft.title);
    setPrep(String(draft.prepMinutes || ''));
    setCook(String(draft.cookMinutes || ''));
    setPortions(String(draft.portions || 4));
    setTags(draft.tags.join(', '));
    setIngredients(ingredientText(draft.ingredients, aisleLabel));
    setSteps(draft.steps.join('\n'));
    setSourceUrl(draft.sourceUrl ?? null);
    setSourceLanguage(draft.sourceLanguage ?? null);
    setPhotoUrl(draft.photoUrl ?? null);
    setDifficulty(draft.difficulty ?? 'easy');
  };

  const runImport = async () => {
    if (!importUrl.trim()||importInFlight.current) return;
    importInFlight.current=true;setImporting(true);
    setImportError('');
    try {
      const draft = await importRecipeFromUrl(importUrl);
      applyImportedDraft(draft);
      setImportOpen(false);
      setEditor(true);
    } catch (e: any) {
      setImportError(localizedRecipeError(e,'recipes.importError'));
    } finally {
      importInFlight.current=false;setImporting(false);
    }
  };

  const runPhotoImport = async (source: 'camera' | 'library') => {
    if(photoImportInFlight.current)return;
    photoImportInFlight.current=true;setPhotoImportError('');
    setPhotoImporting(true);
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) throw new Error(locale.t('recipes.photoPermission'));
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
      }
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setLocalPhotoPreview(asset.uri);
      const draft = await importRecipeFromPhoto({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType,
        demoMode,
      });
      applyImportedDraft(draft);
      setPhotoImportOpen(false);
      setEditor(true);
    } catch (e: any) {
      setPhotoImportError(localizedRecipeError(e,'recipes.photoError'));
    } finally {
      photoImportInFlight.current=false;setPhotoImporting(false);
    }
  };

  const toggleFavorite = async (recipe: Recipe) => {
    if(favoriteInFlight.current.has(recipe.id))return;
    favoriteInFlight.current.add(recipe.id);
    const next = !recipe.favorite;
    setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, favorite: next } : r)));
    if (selected?.id === recipe.id) setSelected({ ...recipe, favorite: next });
    try {
      if (!demoMode) await setRecipeFavorite(recipe.id, next);
    } catch {
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, favorite: recipe.favorite } : r)));
      if (selected?.id === recipe.id) setSelected({ ...recipe, favorite: recipe.favorite });
    } finally {
      favoriteInFlight.current.delete(recipe.id);
    }
  };

  const addSelectedToShopping = async () => {
    if (!selected||shoppingInFlight.current) return;
    shoppingInFlight.current=true;setDetailMessage('');
    try {
      const count = demoMode
        ? await addRecipeIngredientsToCachedShopping(householdId, localIsoDate(weekStart), selected.ingredients ?? [])
        : await addRecipeToShopping(householdId, localIsoDate(weekStart), selected.id);
      setDetailMessage(
        locale.t(count === 1 ? 'recipes.shoppingAddedOne' : 'recipes.shoppingAddedMany', { count }),
      );
    } catch (e: any) {
      if(!(await handlePremiumRefusal(e)))setDetailMessage(locale.t('recipes.shoppingError'));
    } finally { shoppingInFlight.current=false; }
  };

  const save = async () => {
    if (!title.trim()||saveInFlight.current) return;
    saveInFlight.current=true;
    try {
      const draft: RecipeDraft = {
        title: title.trim(),
        prepMinutes: Number(prep) || 0,
        cookMinutes: Number(cook) || 0,
        portions: Math.max(1, Number(portions) || 4),
        tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
        ingredients: parseIngredients(ingredients),
        steps: steps.split('\n').map((x) => x.trim()).filter(Boolean),
        sourceUrl,
        sourceLanguage,
        photoUrl,
        difficulty,
      };

      if (demoMode) {
        setRecipes((r) => [
          ...r,
          {
            id: `d-${Date.now()}`,
            title: draft.title,
            prep_minutes: draft.prepMinutes,
            cook_minutes: draft.cookMinutes,
            portions: draft.portions,
            tags: draft.tags,
            ingredients: draft.ingredients,
            steps: draft.steps,
            source_url: draft.sourceUrl,
            source_language: draft.sourceLanguage,
            photo_url: draft.photoUrl,
            difficulty: draft.difficulty,
            favorite: false,
          },
        ]);
        setEditor(false);
        reset();
        return;
      }

      setSaving(true);
      setError('');
      try {
        await createRecipe(householdId, draft);
        setEditor(false);
        reset();
        await load();
      } catch (e: any) {
        if(!(await handlePremiumRefusal(e)))setError(locale.t('recipes.createError'));
      }
    } finally {
      saveInFlight.current=false;setSaving(false);
    }
  };

  const displayUnit = (ingredient: RecipeIngredient) => {
    if (!ingredient.unit) return '';
    const normalized = normalizeUnit(ingredient.unit);
    if (normalized && unitCodes.has(normalized as UnitCode)) {
      if (normalized === 'piece' && ingredient.quantity != null && ingredient.quantity !== 1) {
        return locale.t('unit.piece_plural');
      }
      return locale.t(`unit.${normalized}` as any);
    }
    return ingredient.unit;
  };

  const ingredientLine = (ingredient: RecipeIngredient) => {
    if (ingredient.quantity == null) return ingredient.name;
    const unit = displayUnit(ingredient);
    return `${ingredient.name} — ${locale.formatNumber(ingredient.quantity)}${unit ? ` ${unit}` : ''}`;
  };

  const portionLabel = (count: number) =>
    locale.t(count === 1 ? 'recipes.portionOne' : 'recipes.portionMany');

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={locale.t('recipes.title')}
          subtitle={`${locale.t('recipes.subtitle')}${!familyAccess ? ` · ${locale.t('recipes.subtitleFree', { count: recipes.length })}` : ''}`}
          right={<Pressable onPress={() => setAddMenuOpen(true)} style={styles.plus} accessibilityRole="button" accessibilityLabel={locale.t('recipes.newRecipe')}><Text style={styles.plusText}>＋</Text></Pressable>}
        />

        <TextInput
          accessibilityLabel={locale.t('recipes.search')}
          value={query}
          onChangeText={setQuery}
          placeholder={locale.t('recipes.search')}
          placeholderTextColor={colors.placeholder}
          style={[styles.search, { textAlign }]}
        />

        <View style={styles.filterBar}>
          <Pressable accessibilityRole="button" accessibilityState={{selected:favoritesOnly}}
            onPress={() => setFavoritesOnly((v) => !v)}
            style={[styles.filter, favoritesOnly && styles.filterActive]}
          >
            <Text style={[styles.filterText, favoritesOnly && styles.filterTextActive]}>{locale.t('recipes.favorites')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{expanded:filtersOpen}}
            onPress={() => setFiltersOpen((v) => !v)}
            style={[styles.filter, activeFilterCount > 0 && styles.filterActive]}
          >
            <Text style={[styles.filterText, activeFilterCount > 0 && styles.filterTextActive]}>
              {locale.t('recipes.filters')}{activeFilterCount ? ` · ${activeFilterCount}` : ''}
            </Text>
          </Pressable>
          {(activeFilterCount > 0 || favoritesOnly) ? (
            <Pressable accessibilityRole="button" onPress={clearFilters} style={styles.clearFilter}>
              <Text style={styles.clearFilterText}>{locale.t('recipes.all')}</Text>
            </Pressable>
          ) : null}
        </View>

        {filtersOpen ? <View style={styles.advancedFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <Pressable accessibilityRole="button" accessibilityState={{selected:timeFilter==='30'}} onPress={() => setTimeFilter(timeFilter === '30' ? 'all' : '30')} style={[styles.filter, timeFilter === '30' && styles.filterActive]}>
              <Text style={[styles.filterText, timeFilter === '30' && styles.filterTextActive]}>≤ 30 min</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{selected:timeFilter==='60'}} onPress={() => setTimeFilter(timeFilter === '60' ? 'all' : '60')} style={[styles.filter, timeFilter === '60' && styles.filterActive]}>
              <Text style={[styles.filterText, timeFilter === '60' && styles.filterTextActive]}>≤ 60 min</Text>
            </Pressable>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <Pressable accessibilityRole="button" accessibilityState={{selected:difficultyFilter===d}} key={d} onPress={() => setDifficultyFilter(difficultyFilter === d ? 'all' : d)} style={[styles.filter, difficultyFilter === d && styles.filterActive]}>
                <Text style={[styles.filterText, difficultyFilter === d && styles.filterTextActive]}>{locale.t(`difficulty.${d}` as any)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {availableTags.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersSecondary}>
            {availableTags.map((tag) => (
              <Pressable accessibilityRole="button" accessibilityState={{selected:tagFilter===tag}} key={tag} onPress={() => setTagFilter(tagFilter === tag ? '' : tag)} style={[styles.filter, tagFilter === tag && styles.filterActive]}>
                <Text style={[styles.filterText, tagFilter === tag && styles.filterTextActive]}>#{tag}</Text>
              </Pressable>
            ))}
          </ScrollView> : null}
        </View> : null}

        {loading ? (
          <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} style={{ marginTop: 30 }} />
        ) : (
          filtered.map((recipe) => (
            <Pressable accessibilityRole="button" key={recipe.id} onPress={() => setSelected(recipe)} style={styles.card}>
              {recipe.photo_url ? (
                <Image source={{ uri: recipe.photo_url }} style={styles.photo} />
              ) : (
                <View style={styles.recipeMark}><View style={styles.recipeMarkPlate}/><View style={styles.recipeMarkCenter}/></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.recipeTitle, { textAlign }]}>{recipe.title}</Text>
                <Text style={[styles.meta, { textAlign }]}>
                  {recipe.prep_minutes + recipe.cook_minutes} min · {recipe.portions} {portionLabel(recipe.portions)} ·{' '}
                  {locale.t(`difficulty.${recipe.difficulty ?? 'easy'}` as any)}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={locale.t(recipe.favorite ? 'recipes.removeFavoriteA11y' : 'recipes.addFavoriteA11y')} accessibilityState={{selected:recipe.favorite}} hitSlop={5}
                onPress={(event) => {
                  event.stopPropagation();
                  toggleFavorite(recipe);
                }}
                style={styles.heart}
              >
                <Text style={[styles.heartText, recipe.favorite && styles.heartActive]}>
                  {recipe.favorite ? '♥' : '♡'}
                </Text>
              </Pressable>
            </Pressable>
          ))
        )}

        {!loading && !filtered.length ? (
          <EmptyState
            title={locale.t(recipes.length ? 'recipes.noResultsTitle' : 'recipes.emptyLibraryTitle')}
            description={locale.t(recipes.length ? 'recipes.noResultsText' : 'recipes.emptyLibraryText')}
            actionLabel={!recipes.length ? locale.t('recipes.emptyAction') : undefined}
            onAction={!recipes.length ? () => setAddMenuOpen(true) : undefined}
            rtl={locale.textDirection === 'rtl'}
          />
        ) : null}
        {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.error, { textAlign }]}>{error}</Text> : null}
      </ScrollView>

      <Modal
        visible={Boolean(selected)}
        animationType="slide"
        onRequestClose={() => {
          setSelected(null);
          setDetailMessage('');
        }}
      >
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { textAlign }]}>{selectedForDisplay?.title}</Text>
              <Text style={[styles.detailMeta, { textAlign }]}>
                {(selected?.prep_minutes ?? 0) + (selected?.cook_minutes ?? 0)} min · {selected?.portions}{' '}
                {selected ? portionLabel(selected.portions) : ''} ·{' '}
                {locale.t(`difficulty.${selected?.difficulty ?? 'easy'}` as any)}
              </Text>
            </View>
            <Text accessibilityRole="button"
              onPress={() => {
                setSelected(null);
                setDetailMessage('');
              }}
              style={styles.close}
            >
              {locale.t('recipes.close')}
            </Text>
          </View>

          {selected?.photo_url ? <Image source={{ uri: selected.photo_url }} style={styles.hero} /> : null}
          {translation ? <Text style={[styles.translationNote,{textAlign}]}>{locale.t('recipes.translatedView')}</Text> : null}
          {selected?.tags?.length ? (
            <View style={styles.tags}>
              {selected.tags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}
            </View>
          ) : null}
          {selected?.source_url ? (
            <Pressable accessibilityRole="button" onPress={() => Linking.openURL(selected.source_url!)} style={styles.source}>
              <Text style={styles.sourceText}>{locale.t('recipes.openSource')}</Text>
            </Pressable>
          ) : null}

          <Pressable accessibilityRole="button" onPress={() => selectedForDisplay && setCooking(selectedForDisplay)} style={styles.cookingButton}>
            <Text style={styles.cookingButtonText}>{locale.t('recipes.startCooking')}</Text>
          </Pressable>
          <View style={styles.detailActions}>
            <Pressable accessibilityRole="button" accessibilityState={{selected:Boolean(selected?.favorite)}} onPress={() => selected && toggleFavorite(selected)} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>
                {selected?.favorite ? locale.t('recipes.removeFavorite') : locale.t('recipes.addFavorite')}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={addSelectedToShopping} style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>{locale.t('recipes.addToShopping')}</Text>
            </Pressable>
          </View>
          {detailMessage ? <Text style={[styles.detailMessage, { textAlign }]}>{detailMessage}</Text> : null}

          <Text style={[styles.detailSection, { textAlign }]}>{locale.t('recipes.ingredients')}</Text>
          {selectedForDisplay?.ingredients?.length ? (
            selectedForDisplay.ingredients.map((ingredient, index) => (
              <View key={`${ingredient.name}-${index}`} style={styles.detailRow}>
                <Text style={styles.detailBullet}>•</Text>
                <Text style={[styles.detailText, { textAlign }]}>{ingredientLine(ingredient)}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.help, { textAlign }]}>{locale.t('recipes.noIngredients')}</Text>
          )}

          <Text style={[styles.detailSection, { textAlign }]}>{locale.t('recipes.preparation')}</Text>
          {selectedForDisplay?.steps?.length ? (
            selectedForDisplay.steps.map((step, index) => (
              <View key={`${index}-${step}`} style={styles.stepRow}>
                <View style={styles.stepNo}><Text style={styles.stepNoText}>{index + 1}</Text></View>
                <Text style={[styles.stepText, { textAlign }]}>{step}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.help, { textAlign }]}>{locale.t('recipes.noSteps')}</Text>
          )}

          {selected ? <RecipeTasteCard householdId={householdId} recipeId={selected.id} demoMode={demoMode} onFamilyRequired={()=>handlePremiumRefusal(new Error('FAMILY_PLAN_REQUIRED'))} /> : null}
        </ScrollView>
      </Modal>

      <Modal
        visible={Boolean(cooking)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCooking(null)}
      >
        {cooking ? <CookingModeScreen recipe={cooking} onClose={() => setCooking(null)} /> : null}
      </Modal>

      <Modal visible={addMenuOpen} transparent animationType="fade" onRequestClose={() => setAddMenuOpen(false)}>
        <View style={styles.actionOverlay}>
          <Pressable accessible={false} style={styles.actionBackdrop} onPress={() => setAddMenuOpen(false)} />
          <View style={styles.actionSheet}>
            <View style={styles.actionHandle} />
            <Text style={[styles.actionTitle, { textAlign }]}>{locale.t('recipes.newRecipe')}</Text>
            <Pressable accessibilityRole="button" onPress={() => { setAddMenuOpen(false); openManual(); }} style={styles.actionChoice}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionChoiceText, { textAlign }]}>{locale.t('recipes.newRecipe')}</Text>
                <Text style={[styles.actionChoiceHint, { textAlign }]}>{locale.t('recipes.editBeforeSave')}</Text>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setAddMenuOpen(false); openUrlImport(); }} style={styles.actionChoice}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionChoiceText, { textAlign }]}>{locale.t('recipes.importLink')}</Text>
                <Text style={[styles.actionChoiceHint, { textAlign }]}>{locale.t('recipes.importLinkDesc')}</Text>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setAddMenuOpen(false); openPhotoImport(); }} style={styles.actionChoice}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionChoiceText, { textAlign }]}>{locale.t('recipes.importPhoto')}</Text>
                <Text style={[styles.actionChoiceHint, { textAlign }]}>{locale.t('recipes.importPhotoDesc')}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={paywallOpen} animationType="slide" onRequestClose={() => setPaywallOpen(false)}>
        <PaywallScreen
          access={access}
          demo={demoMode}
          onClose={() => setPaywallOpen(false)}
          onStartTrial={
            !demoMode && access.plan === 'free' && onStartTrial
              ? async () => {
                  await onStartTrial();
                  setPaywallOpen(false);
                }
              : undefined
          }
        />
      </Modal>

      <Modal visible={photoImportOpen} animationType="slide" onRequestClose={() => setPhotoImportOpen(false)}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { textAlign }]}>{locale.t('recipes.photoImportTitle')}</Text>
              <Text style={[styles.detailMeta, { textAlign }]}>{locale.t('recipes.photoImportSubtitle')}</Text>
            </View>
            <Text accessibilityRole="button" onPress={() => setPhotoImportOpen(false)} style={styles.close}>{locale.t('recipes.close')}</Text>
          </View>

          <Pressable accessibilityRole="button" disabled={photoImporting} accessibilityState={{disabled:photoImporting}} onPress={() => runPhotoImport('camera')} style={styles.photoChoice}>
            <Text style={styles.photoChoiceIcon}>📷</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.photoChoiceTitle, { textAlign }]}>{locale.t('recipes.takePhoto')}</Text>
              <Text style={[styles.photoChoiceText, { textAlign }]}>{locale.t('recipes.takePhotoDesc')}</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={photoImporting} accessibilityState={{disabled:photoImporting}} onPress={() => runPhotoImport('library')} style={styles.photoChoice}>
            <Text style={styles.photoChoiceIcon}>🖼️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.photoChoiceTitle, { textAlign }]}>{locale.t('recipes.choosePhoto')}</Text>
              <Text style={[styles.photoChoiceText, { textAlign }]}>{locale.t('recipes.choosePhotoDesc')}</Text>
            </View>
          </Pressable>
          {photoImporting ? (
            <View style={styles.photoBusy}>
              <ActivityIndicator accessibilityRole="progressbar" accessibilityLabel={locale.t('common.loading')} color={colors.sageDark} />
              <Text style={styles.photoBusyText}>{locale.t('recipes.reading')}</Text>
            </View>
          ) : null}
          {photoImportError ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.errorLeft, { textAlign }]}>{photoImportError}</Text> : null}
          <Text style={[styles.importHint, { textAlign }]}>
            {demoMode ? locale.t('recipes.ocrDemo') : locale.t('recipes.ocrLive')}
          </Text>
        </ScrollView>
      </Modal>

      <Modal visible={importOpen} animationType="slide" onRequestClose={() => setImportOpen(false)}>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { textAlign }]}>{locale.t('recipes.urlImportTitle')}</Text>
              <Text style={[styles.detailMeta, { textAlign }]}>{locale.t('recipes.urlImportSubtitle')}</Text>
            </View>
            <Text accessibilityRole="button" onPress={() => setImportOpen(false)} style={styles.close}>{locale.t('recipes.close')}</Text>
          </View>
          <Text style={[styles.fieldLabel, { textAlign }]}>{locale.t('recipes.urlLabel')}</Text>
          <TextInput
            accessibilityLabel={locale.t('recipes.urlLabel')}
            value={importUrl}
            onChangeText={setImportUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://…"
            placeholderTextColor={colors.placeholder}
            style={[styles.fieldInput, { textAlign }]}
          />
          {importError ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={[styles.errorLeft, { textAlign }]}>{importError}</Text> : null}
          <Pressable accessibilityRole="button"
            onPress={runImport}
            disabled={!importUrl.trim() || importing} accessibilityState={{disabled:!importUrl.trim() || importing}}
            style={[styles.save, (!importUrl.trim() || importing) && { opacity: 0.4 }]}
          >
            <Text style={styles.saveText}>
              {importing ? locale.t('recipes.importing') : locale.t('recipes.importAndCheck')}
            </Text>
          </Pressable>
          <Text style={[styles.importHint, { textAlign }]}>{locale.t('recipes.urlImportHint')}</Text>
        </ScrollView>
      </Modal>

      <Modal visible={editor} animationType="slide" onRequestClose={() => setEditor(false)}>
        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { textAlign }]}>
                {sourceUrl ? locale.t('recipes.verifyImport') : locale.t('recipes.newRecipe')}
              </Text>
              {sourceUrl ? (
                <Text style={[styles.detailMeta, { textAlign }]}>{locale.t('recipes.editBeforeSave')}</Text>
              ) : null}
            </View>
            <Text accessibilityRole="button" onPress={() => setEditor(false)} style={styles.close}>{locale.t('recipes.close')}</Text>
          </View>

          {localPhotoPreview || photoUrl ? (
            <Image source={{ uri: localPhotoPreview || photoUrl || '' }} style={styles.hero} />
          ) : null}
          {sourceUrl ? (
            <View style={styles.importedBadge}>
              <Text style={styles.importedBadgeText}>{locale.t('recipes.webImportedBadge')}</Text>
            </View>
          ) : null}

          <Field label={locale.t('recipes.fieldTitle')} value={title} onChange={setTitle} placeholder={locale.t('recipes.titlePlaceholder')} />
          <View style={styles.twoCols}>
            <View style={{ flex: 1 }}>
              <Field label={locale.t('recipes.prepMinutes')} value={prep} onChange={setPrep} placeholder="20" numeric />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={locale.t('recipes.cookMinutes')} value={cook} onChange={setCook} placeholder="30" numeric />
            </View>
          </View>
          <Field label={locale.t('recipes.portions')} value={portions} onChange={setPortions} placeholder="4" numeric />
          <Field label={locale.t('recipes.tags')} value={tags} onChange={setTags} placeholder={locale.t('recipes.tagsPlaceholder')} />

          <Text style={[styles.fieldLabel, { textAlign }]}>{locale.t('recipes.difficulty')}</Text>
          <View style={styles.difficultyRow}>
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <Pressable accessibilityRole="button" accessibilityState={{selected:difficulty===d}}
                key={d}
                onPress={() => setDifficulty(d)}
                style={[styles.difficultyChip, difficulty === d && styles.difficultyActive]}
              >
                <Text style={[styles.difficultyText, difficulty === d && styles.difficultyTextActive]}>
                  {locale.t(`difficulty.${d}` as any)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { textAlign }]}>{locale.t('recipes.ingredients')}</Text>
          <Text style={[styles.help, { textAlign }]}>{locale.t('recipes.ingredientsHelp')}</Text>
          <TextInput
            accessibilityLabel={locale.t('recipes.ingredients')}
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            placeholder={locale.t('recipes.ingredientsPlaceholder')}
            placeholderTextColor={colors.placeholder}
            style={[styles.fieldInput, styles.area, { textAlign }]}
          />

          <Text style={[styles.fieldLabel, { textAlign }]}>{locale.t('recipes.steps')}</Text>
          <Text style={[styles.help, { textAlign }]}>{locale.t('recipes.stepsHelp')}</Text>
          <TextInput
            accessibilityLabel={locale.t('recipes.steps')}
            value={steps}
            onChangeText={setSteps}
            multiline
            placeholder={locale.t('recipes.stepsPlaceholder')}
            placeholderTextColor={colors.placeholder}
            style={[styles.fieldInput, styles.area, { textAlign }]}
          />

          <Pressable accessibilityRole="button"
            onPress={save}
            disabled={!title.trim() || saving} accessibilityState={{disabled:!title.trim() || saving,busy:saving}}
            style={[styles.save, (!title.trim() || saving) && { opacity: 0.4 }]}
          >
            <Text style={styles.saveText}>
              {saving ? locale.t('recipes.saving') : locale.t('recipes.saveRecipe')}
            </Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  const locale = useLocale();
  const textAlign = locale.textDirection === 'rtl' ? 'right' : 'left';
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={[styles.fieldLabel, { textAlign }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={numeric ? 'numeric' : 'default'}
        style={[styles.fieldInput, { textAlign }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 28 },
  plus: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.sageDark, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: colors.onAccent, fontSize: 28, lineHeight: 30 },
  search: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 15, minHeight: 48, paddingHorizontal: 14, color: colors.ink, marginTop: 16 },
  filterBar: { flexDirection: 'row', gap: 8, marginTop: 9, flexWrap: 'wrap', alignItems: 'center' },
  advancedFilters: { marginTop: 2 },
  filters: { gap: 8, marginTop: 8, paddingRight: 10 },
  filtersSecondary: { gap: 8, marginTop: 8, paddingRight: 10 },
  filter: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  filterActive: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  filterText: { fontSize: 11, fontWeight: '800', color: colors.muted },
  filterTextActive: { color: colors.onAccent },
  clearFilter: { paddingHorizontal: 6, paddingVertical: 8 },
  clearFilterText: { color: colors.sageDark, fontSize: 11, fontWeight: '800' },
  actionOverlay: { flex: 1, justifyContent: 'flex-end' },
  actionBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  actionSheet: { backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, borderWidth: 1, borderColor: colors.border },
  actionHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: colors.iconMuted, alignSelf: 'center', marginBottom: 16 },
  actionTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  actionChoice: { minHeight: 62, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 10 },
  actionChoiceText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  actionChoiceHint: { color: colors.muted, fontSize: 11, marginTop: 3, lineHeight: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginTop: 10 },
  recipeMark: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  recipeMarkPlate: { width: 25, height: 25, borderRadius: 13, borderWidth: 2, borderColor: colors.sageDark },
  recipeMarkCenter: { position: 'absolute', width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: colors.orange },
  photo: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.sageSoft },
  recipeTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  tag: { fontSize: 10, color: colors.sageDark, backgroundColor: colors.sageSoft, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  heart: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  heartText: { fontSize: 24, color: colors.iconMuted },
  heartActive: { color: colors.orange },
  empty: { color: colors.muted, marginTop: 30 },
  error: { color: colors.error, marginTop: 16 },
  errorLeft: { color: colors.error, marginTop: 12, lineHeight: 19 },
  modalContent: { padding: 22, paddingTop: 60, paddingBottom: 50, backgroundColor: colors.cream, minHeight: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  modalTitle: { fontSize: 28, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  detailMeta: { color: colors.muted, fontSize: 12, marginTop: 5, lineHeight: 18 },
  close: { color: colors.sageDark, fontWeight: '800', paddingTop: 8 },
  hero: { width: '100%', height: 190, borderRadius: 20, marginTop: 18, backgroundColor: colors.sageSoft },
  source: { marginTop: 14, alignSelf: 'flex-start' },
  translationNote:{marginTop:10,color:colors.sageDark,fontSize:11,fontWeight:'700',backgroundColor:colors.sageSoft,paddingHorizontal:10,paddingVertical:7,borderRadius:10},
  sourceText: { color: colors.sageDark, fontWeight: '800', fontSize: 12 },
  detailSection: { color: colors.muted, fontSize: 11, letterSpacing: 1.1, fontWeight: '900', marginTop: 24, marginBottom: 8 },
  detailRow: { flexDirection: 'row', gap: 8, paddingVertical: 6 },
  detailBullet: { color: colors.orange, fontWeight: '900' },
  detailText: { color: colors.ink, fontSize: 14, flex: 1 },
  stepRow: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'flex-start' },
  stepNo: { width: 26, height: 26, borderRadius: 9, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { color: colors.sageDark, fontWeight: '900', fontSize: 12 },
  stepText: { color: colors.ink, fontSize: 14, lineHeight: 20, flex: 1 },
  twoCols: { flexDirection: 'row', gap: 10 },
  difficultyRow: { flexDirection: 'row', gap: 8 },
  difficultyChip: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  difficultyActive: { backgroundColor: colors.sageDark, borderColor: colors.sageDark },
  difficultyText: { fontSize: 11, fontWeight: '800', color: colors.ink },
  difficultyTextActive: { color: colors.onAccent },
  fieldLabel: { color: colors.ink, fontWeight: '800', fontSize: 13, marginTop: 14, marginBottom: 7 },
  help: { color: colors.muted, fontSize: 11, lineHeight: 16, marginBottom: 7 },
  fieldInput: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 15, minHeight: 50, paddingHorizontal: 14, color: colors.ink },
  area: { minHeight: 120, paddingTop: 12, textAlignVertical: 'top' },
  save: { backgroundColor: colors.sageDark, minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  saveText: { color: colors.onAccent, fontWeight: '800', fontSize: 16 },
  importHint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 16 },
  importedBadge: { alignSelf: 'flex-start', backgroundColor: colors.sageSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, marginTop: 12 },
  importedBadgeText: { color: colors.sageDark, fontSize: 11, fontWeight: '800' },
  cookingButton: { marginTop: 16, minHeight: 52, borderRadius: 14, backgroundColor: colors.sageDark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  cookingButtonText: { color: colors.onAccent, fontWeight: '900', fontSize: 13 },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  secondaryAction: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  secondaryActionText: { color: colors.sageDark, fontWeight: '800', fontSize: 11, textAlign: 'center' },
  detailMessage: { color: colors.sageDark, fontSize: 11, fontWeight: '700', marginTop: 8, lineHeight: 16 },
  photoChoice: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16, marginTop: 14 },
  photoChoiceIcon: { fontSize: 26 },
  photoChoiceTitle: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  photoChoiceText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  photoBusy: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  photoBusyText: { color: colors.sageDark, fontWeight: '700', fontSize: 12 },
});
