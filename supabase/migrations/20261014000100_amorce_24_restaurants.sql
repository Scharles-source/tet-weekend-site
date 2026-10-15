-- Amorce : les 24 restaurants vérifiés le 14 oct. 2026 (classement d'origine : note Google × nombre d'avis).
-- Tous en BROUILLON et SANS menu : invisibles en public tant que le menu n'est pas collecté et le statut passé à « publie ».
-- Seules les informations relevées sont saisies ; tout le reste reste null (= non renseigné).

insert into public.restaurants
  (slug, nom, zones, quartier, instagram, note_google, avis_google, avis_google_approx, rang_amorce, statut, notes_internes)
values
  ('portofino-ristorante-italiano', 'Portofino Ristorante Italiano', array['Pétion-Ville'], 'Pétion-Ville (Place Boyer)', 'portofinohaiti', 4.3, 1000, true, 1, 'brouillon', null),
  ('magdoos', 'Magdoos', array['Pétion-Ville'], 'Pétion-Ville (Rue Oge)', 'magdooshaiti', 4.3, 545, false, 2, 'brouillon',
    'Nombre d''abonnés Instagram à re-vérifier (compteur incohérent selon l''outil).'),
  ('cafe36-resto-hotel-la-lorraine', 'Cafe36 Resto Hôtel (La Lorraine)', array['Pétion-Ville'], 'Pétion-Ville (Clerveau)', 'cafe36haiti', 4.3, 233, false, 3, 'brouillon', null),
  ('kay-bilolo', 'Kay Bilolo', array['Delmas'], 'Delmas 40B', 'kaybilolo_ht', 4.5, 29, false, 4, 'brouillon',
    'Très peu d''avis Google (29) : note fragile.'),
  ('karibe-hotel-la-brasserie', 'Karibe Hotel — La Brasserie', array['Pétion-Ville'], 'Pétion-Ville (Juvenat)', 'karibehotel', 4.2, 1311, false, 5, 'brouillon',
    'À CONFIRMER AVANT PUBLICATION : un agrégateur la signale « fermée définitivement » alors que l''hôtel la promeut encore.'),
  ('kinam-hotel-restaurant', 'Kinam Hotel — Restaurant', array['Pétion-Ville'], 'Pétion-Ville (Place Saint-Pierre)', 'kinamhotel', 4.2, 407, false, 6, 'brouillon', null),
  ('pistachio-cafe-bistro', 'Pistachio Café Bistro', array['Pétion-Ville'], 'Pétion-Ville (Rue Chavannes)', 'pistachiohaiti', 4.2, 258, false, 7, 'brouillon', null),
  ('papaye', 'Papaye', array['Pétion-Ville'], 'Pétion-Ville (Metellus)', 'papayerestaurant', 4.2, 205, false, 8, 'brouillon', null),
  ('la-reserve', 'La Réserve', array['Pétion-Ville'], 'Pétion-Ville (Berthé)', 'lareserveht', 4.1, 171, false, 9, 'brouillon', null),
  ('smoke-house-barbecue', 'Smoke House Barbecue', array['Delmas'], 'Delmas 75', 'smokehouse_ht', 4.1, 70, false, 10, 'brouillon', null),
  ('pizza-garden', 'Pizza Garden', array['Pétion-Ville'], 'Pétion-Ville (Rue Chavannes)', 'pizzagardenhaiti', 4.0, 1200, true, 11, 'brouillon', null),
  ('coin-des-artistes-vivano', 'Coin des Artistes – Vivano', array['Pétion-Ville'], 'Pétion-Ville (Av. Panaméricaine)', 'coindesartistes.vivano', 4.0, 425, false, 12, 'brouillon', null),
  ('rootz-food-art-music', 'Rootz Food + Art + Music', array['Pétion-Ville'], 'Pétion-Ville (Rue Rebecca)', 'rootz_bycheftpat', 4.0, 205, false, 13, 'brouillon', null),
  ('gecko-lounge-bar', 'Gecko Lounge Bar', array['Delmas'], 'Delmas 75', 'geckoloungehaiti', 4.0, 11, false, 14, 'brouillon',
    'Très peu d''avis Google (11) : note fragile.'),
  ('timeout-sports-bar-grill', 'TimeOut Sports Bar & Grill', array['Delmas'], 'Delmas 75', 'timeoutsport75', 3.9, 75, false, 15, 'brouillon', null),
  ('le-poulet-d-or', 'Le Poulet d''Or', array['Pétion-Ville'], 'Pétion-Ville (Rue Louverture)', 'lepouletdor', 3.9, 543, false, 16, 'brouillon', null),
  ('green-bar', 'Green Bar', array['Delmas'], 'Delmas 75 (Fragneauville)', 'greenbarhaiti', 3.8, 130, false, 17, 'brouillon', null),
  ('jojo-restaurant-evergreen', 'Jojo Restaurant (Evergreen)', array['Pétion-Ville'], 'Pétion-Ville (Av. Panaméricaine)', 'jojorestauranthaiti', 3.8, 852, false, 18, 'brouillon', null),
  ('point-chaud', 'Point Chaud', array['Pétion-Ville', 'Delmas'], 'Pétion-Ville / Delmas (chaîne)', 'point_chaud', 3.8, 1100, true, 19, 'brouillon',
    'Chaîne à plusieurs adresses : préciser la ou les succursales relevées.'),
  ('flame-lounge-bar-grill', 'FLAME Lounge Bar & Grill', array['Delmas'], 'Delmas', 'flamehaiti', 3.7, 93, false, 20, 'brouillon', null),
  ('kokoriko-breakfast-lunch', 'Kokoriko Breakfast & Lunch', array['Delmas'], 'Delmas 33 (Station Siloe)', 'kokorikobreakfastandlunch', 3.4, 18, false, 21, 'brouillon',
    'Très peu d''avis Google (18) : note fragile.'),
  ('5-coins', '5 Coins', array['Delmas', 'Pétion-Ville'], 'Delmas 60 (aussi PV, Delmas 40)', '5coinsrest_ht', 3.7, 615, false, 22, 'brouillon',
    'Plusieurs succursales (Delmas 60, Pétion-Ville, Delmas 40) : préciser celle relevée.'),
  ('kokoye-bar-grill', 'Kokoye Bar & Grill', array['Delmas', 'Pétion-Ville'], 'Delmas 31 (aussi PV)', 'kokoyehaiti', 3.7, 2000, true, 23, 'brouillon',
    'Écart entre sources sur la note (3,7 / ~2 000 vs 3,95 / 333) : valeur retenue 3,7 / ~2 000.'),
  ('mr-frosty', 'Mr Frosty', array['Delmas'], 'Delmas 41 (Rue Euclide)', 'mrfrostyht', 3.6, 431, false, 24, 'brouillon', null)
on conflict (slug) do nothing;
