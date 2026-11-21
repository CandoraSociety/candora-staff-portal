import FestivalAreaPage from '@/components/winterwonderland/FestivalAreaPage';
import GiftShopRegistrations from '@/components/winterwonderland/GiftShopRegistrations';
import { FESTIVAL_AREAS } from '@/lib/winterFestivalAreas';

export default function WinterWonderlandKidsGiftShop() {
  return (
    <FestivalAreaPage
      area={FESTIVAL_AREAS.kidsGiftShop}
      extraTabs={[{ value: 'registration', label: 'Registration', content: <GiftShopRegistrations /> }]}
    />
  );
}