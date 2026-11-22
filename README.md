# Planowanie krok po kroku bez wedding plannera

Statyczna, responsywna strona sprzedażowa jednego e-booka PDF. Projekt nie zawiera pełnego PDF-u — podgląd pokazuje wyłącznie krótkie fragmenty arkuszy.

## Podgląd lokalny

Otwórz `index.html` w przeglądarce albo uruchom prosty serwer statyczny w tym katalogu. Strona nie wymaga instalowania pakietów ani budowania aplikacji.

## Przed uruchomieniem sprzedaży

Uzupełnij `config.js`:

- `priceLabel` — rzeczywista cena, np. `79 zł`;
- `checkoutUrl` — bezpieczny link HTTPS do produktu lub koszyka w Naffy, Easycart albo innej wybranej platformie;
- `sellerName` i `contactEmail` — prawdziwe dane sprzedawcy i kontakt;
- `termsUrl`, `privacyUrl`, `consumerRightsUrl` — opublikowane dokumenty i informacje dla konsumenta.

Gdy `checkoutUrl` pozostaje pusty, strona działa w trybie demonstracyjnym i nie prowadzi do płatności. Link do platformy aktywuje przycisk „Kup teraz”. Platformę sprzedażową skonfiguruj tak, by po opłaceniu zamówienia udostępniała klientowi PDF.

Pełny, płatny PDF przechowuj i dostarczaj w platformie sprzedażowej. Nie dodawaj go do tego repozytorium ani do publicznego katalogu strony.

Przed publikacją uzupełnij także widoczne w stopce pola sprzedawcy, regulaminu, polityki prywatności i informacji o prawach konsumenta. Dane w projekcie pozostawiono do uzupełnienia, ponieważ nie zostały przekazane.

## Publikacja w Netlify

Projekt jest statyczny. Możesz zaimportować repozytorium do Netlify i ustawić katalog publikacji na `.`. `netlify.toml` zawiera tę konfigurację. Nie jest wymagany proces budowania.

## Zakres i źródła treści

Teksty opisujące produkt powstały na podstawie przekazanego 38-stronicowego PDF-u. E-book podaje źródła i wyraźnie zaznacza, że informacje urzędowe mogą się zmieniać, a przegląd publicznych rozmów nie jest reprezentatywnym badaniem rynku.

W materiałach nie było zrzutu ekranu z Pinteresta ani danych sprzedawcy, ceny lub działającego koszyka. W tym środowisku nie była też dostępna integracja Topview ani narzędzie generowania obrazów. Dlatego zastosowano autorską, lekką oprawę SVG/CSS inspirowaną estetyką papierowego poradnika. Strona nie zawiera opinii, fikcyjnej ceny ani symulacji zakupu.
