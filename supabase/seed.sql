-- Seed data for HIST 12B LA housing & homelessness project
-- Run this after 001_init.sql.

-- Citations
insert into public.citations (id, citation_key, title, author, year, publication, url, notes)
values
  (
    gen_random_uuid(),
    'de_leon_gentrification_2014',
    'Gentrification in Los Angeles: Displacement, Power, and Identity',
    'Adriana De León',
    2014,
    'Journal of Urban History',
    'https://example.org/de-leon-gentrification-la',
    'Analyzes the racialized politics of redevelopment in central LA.'
  ),
  (
    gen_random_uuid(),
    'desjarlais_shelter_1997',
    'Shelter Blues: Sanity and Selfhood Among the Homeless',
    'Robert Desjarlais',
    1997,
    'University of Pennsylvania Press',
    'https://example.org/desjarlais-shelter-blues',
    'Ethnographic account of shelter life and individualizing logics of care.'
  ),
  (
    gen_random_uuid(),
    'mitchell_right_1997',
    'The Annihilation of Space by Law: The Roots and Implications of Anti-Homeless Laws in the United States',
    'Don Mitchell',
    1997,
    'Antipode',
    'https://example.org/mitchell-right-to-the-city',
    'Classic analysis of anti-homeless ordinances and public space.'
  ),
  (
    gen_random_uuid(),
    'rosen_governing_2015',
    'Governing Homelessness: The Limits of Neoliberal Public Policy',
    'Ruth Rosen',
    2015,
    'Urban Affairs Review',
    'https://example.org/rosen-governing-homelessness',
    'Connects neoliberal governance to homelessness management policies.'
  ),
  (
    gen_random_uuid(),
    'smith_neoliberal_city_2002',
    'New Globalism, New Urbanism: Gentrification as Global Urban Strategy',
    'Neil Smith',
    2002,
    'Antipode',
    'https://example.org/smith-neoliberal-city',
    'Conceptualizes gentrification as a neoliberal urban strategy.'
  ),
  (
    gen_random_uuid(),
    'la_homeless_services_authority_count_2023',
    '2023 Greater Los Angeles Homeless Count',
    'Los Angeles Homeless Services Authority',
    2023,
    'LAHSA',
    'https://www.lahsa.org',
    'Annual point-in-time count for Los Angeles County.'
  ),
  (
    gen_random_uuid(),
    'martin_v_boise_2018',
    'Martin v. City of Boise',
    'U.S. Court of Appeals for the Ninth Circuit',
    2018,
    ' Ninth Circuit Court of Appeals',
    'https://example.org/martin-v-boise',
    'Landmark decision restricting criminalization of sleeping in public.'
  ),
  (
    gen_random_uuid(),
    'lacity_4118_ordinance',
    'Los Angeles Municipal Code §41.18 (Sidewalk Camping Restrictions)',
    'City of Los Angeles',
    2021,
    'Los Angeles Municipal Code',
    'https://example.org/lacity-41-18',
    'Local ordinance restricting sitting, lying, or sleeping in designated public spaces.'
  ),
  (
    gen_random_uuid(),
    'echo_park_lake_report_2021',
    'Echo Park Lake Closure and Encampment Sweep Report',
    'Los Angeles Times',
    2021,
    'Los Angeles Times',
    'https://example.org/echo-park-lake-report',
    'Journalistic coverage of the 2021 Echo Park Lake sweep and displacement.'
  ),
  (
    gen_random_uuid(),
    'venice_boardwalk_sweep_2019',
    'Venice Boardwalk Encampment Sweeps and Business Improvement District',
    'Venice Justice Committee',
    2019,
    'Community Report',
    'https://example.org/venice-boardwalk-report',
    'Community report documenting sweeps along the Venice Boardwalk.'
  );

-- Locations
insert into public.locations (
  id,
  title,
  slug,
  latitude,
  longitude,
  neighborhood,
  categories,
  era,
  short_summary,
  narrative_md,
  images,
  published
)
values
  (
    gen_random_uuid(),
    'Skid Row',
    'skid-row',
    34.0430,
    -118.2450,
    'Downtown Los Angeles',
    array['shelters', 'policing', 'encampment bans'],
    '1970s–present',
    'Downtown district where policing, shelter provision, and containment strategies converge.',
    'Skid Row has long been framed as a **zone of exception** within downtown Los Angeles. Neoliberal housing logic appears here through concentration of shelters and services, heavy policing, and ordinances that criminalize survival in public space while preserving nearby real-estate values.',
    '{}',
    true
  ),
  (
    gen_random_uuid(),
    'Echo Park Lake Encampment',
    'echo-park-lake-encampment',
    34.0722,
    -118.2606,
    'Echo Park',
    array['sweeps', 'encampment bans', 'redevelopment'],
    '2010s–2020s',
    'A highly visible lakeside encampment cleared in a controversial 2021 sweep.',
    'The Echo Park Lake encampment became a symbol of Los Angeles'' housing crisis. In March 2021, the city fenced off the park and displaced hundreds of residents. The sweep illustrates how **public space management**, tourism, and nearby property values shape decisions about where unhoused people can exist.',
    '{}',
    true
  ),
  (
    gen_random_uuid(),
    'Venice Boardwalk Encampments',
    'venice-boardwalk-encampments',
    33.9850,
    -118.4695,
    'Venice',
    array['sweeps', 'business improvement districts', 'tourism'],
    '1990s–present',
    'Oceanfront walkway where tourism and anti-homeless ordinances collide.',
    'Along the Venice Boardwalk, residents, tourists, and unhoused people share a narrow strip of beachfront. Business Improvement Districts and city officials have promoted sweeps and design interventions that prioritize commerce and spectacle over the right to remain in place.',
    '{}',
    true
  ),
  (
    gen_random_uuid(),
    'Permanent Supportive Housing in Downtown LA',
    'permanent-supportive-housing-dtla',
    34.0455,
    -118.2520,
    'Downtown Los Angeles',
    array['supportive housing', 'redevelopment'],
    '2000s–present',
    'Cluster of permanent supportive housing developments near Skid Row.',
    'Permanent supportive housing projects in downtown LA are often celebrated as evidence-based solutions. At the same time, they are embedded in redevelopment schemes that seek to ''revitalize'' areas adjacent to Skid Row while containing visible poverty.',
    '{}',
    true
  ),
  (
    gen_random_uuid(),
    'LA River Revitalization Corridor',
    'la-river-revitalization-corridor',
    34.0860,
    -118.2230,
    'Elysian Valley / Frogtown',
    array['redevelopment', 'displacement'],
    '2010s–present',
    'Planned greenway and redevelopment projects along the LA River.',
    'Along the LA River, environmental restoration projects intersect with speculative development. Encampments along the riverbanks have faced periodic sweeps as the corridor is reimagined as an amenity for nearby homeowners and investors.',
    '{}',
    true
  );

-- Policies
insert into public.policies (
  id,
  title,
  slug,
  date,
  jurisdiction,
  short_summary,
  narrative_md,
  tags,
  published
)
values
  (
    gen_random_uuid(),
    'Los Angeles Municipal Code §41.18 Expansion',
    'lamc-41-18-expansion',
    '2021-07-01',
    'city',
    'Expansion of sidewalk camping restrictions near schools, shelters, and other designated areas.',
    'The 2021 expansion of **LAMC §41.18** widened the zones where sitting, lying, or sleeping on sidewalks is prohibited. Supporters framed the ordinance as necessary for ''health and safety,'' while critics argued it effectively banned homelessness from whole swaths of the city without providing adequate housing alternatives.',
    array['encampment bans', 'policing', 'public space'],
    true
  ),
  (
    gen_random_uuid(),
    'Martin v. City of Boise',
    'martin-v-boise',
    '2018-09-04',
    'federal',
    'Ninth Circuit decision limiting the criminalization of sleeping in public when shelter is unavailable.',
    'In **Martin v. Boise**, the Ninth Circuit held that cities cannot punish people for sleeping outdoors on public property when they have no access to shelter. The decision constrained some of the most punitive aspects of anti-camping ordinances but did not require cities to build housing.',
    array['courts', 'rights', 'encampment bans'],
    true
  ),
  (
    gen_random_uuid(),
    'HEARTH Act (Homeless Emergency Assistance and Rapid Transition to Housing)',
    'hearth-act-2009',
    '2009-05-20',
    'federal',
    'Federal legislation that restructured homelessness assistance around rapid rehousing and performance metrics.',
    'The **HEARTH Act** consolidated and reoriented federal homelessness programs. It emphasized rapid rehousing and local flexibility, aligning assistance with performance metrics and competitive grantmaking. Critics argue this embeds neoliberal logics of efficiency and competition into homelessness governance.',
    array['federal policy', 'housing-first', 'performance metrics'],
    true
  ),
  (
    gen_random_uuid(),
    'Proposition HHH (Los Angeles City Bond)',
    'proposition-hhh-2016',
    '2016-11-08',
    'city',
    'City bond measure to fund permanent supportive housing and facilities for people experiencing homelessness.',
    'Proposition HHH authorized $1.2 billion in bonds to build permanent supportive housing and facilities. While framed as a major investment, implementation has been slowed by financing rules, neighborhood opposition, and rising construction costs.',
    array['supportive housing', 'bond measures'],
    true
  ),
  (
    gen_random_uuid(),
    'Proposition 47 (Reduced Penalties for Some Crimes)',
    'proposition-47-2014',
    '2014-11-04',
    'state',
    'State ballot initiative reclassifying some nonviolent offenses and reshaping jail and treatment systems.',
    'Proposition 47 reclassified certain nonviolent offenses from felonies to misdemeanors. For unhoused people, changes in low-level drug and property enforcement interacted with shelter and treatment systems, revealing tensions between decarceration and social-service funding.',
    array['state policy', 'criminalization', 'decarmos'],
    true
  ),
  (
    gen_random_uuid(),
    'Safer Cities Initiative in Skid Row',
    'safer-cities-initiative-skid-row',
    '2006-09-01',
    'city',
    'Policing initiative targeting quality-of-life offenses in Skid Row.',
    'The **Safer Cities Initiative** brought a surge of LAPD officers into Skid Row to ticket and arrest people for minor infractions. The program drew on broken-windows theory and framed aggressive enforcement as a path to ''order'' and redevelopment.',
    array['policing', 'broken windows', 'redevelopment'],
    true
  );

-- Note: Join-table seed data is left for the team to add once specific citation and policy IDs
-- are visible in your Supabase project. Use the admin UI to attach citations and relationships
-- to keep this file readable.

