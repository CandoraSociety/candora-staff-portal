import FestivalAreaPage from '@/components/winterwonderland/FestivalAreaPage';
import GiftShopRegistrations from '@/components/winterwonderland/GiftShopRegistrations';
import GiftShopSignIn from '@/components/winterwonderland/GiftShopSignIn';
import GiftShopPreRegistration from '@/components/winterwonderland/GiftShopPreRegistration';
import GiftShopEventOverview from '@/components/winterwonderland/GiftShopEventOverview';
import GiftShopEventArchiveTab from '@/components/winterwonderland/GiftShopEventArchiveTab';
import { FESTIVAL_AREAS } from '@/lib/winterFestivalAreas';

export default function WinterWonderlandKidsGiftShop() {
  return (
    <FestivalAreaPage
      area={FESTIVAL_AREAS.kidsGiftShop}
      accent={{ from: '#102070', to: '#fccf03' }}
      showEvents={false}
      showComponent={false}
      overviewExtra={({ festival }) => <GiftShopEventOverview festival={festival} />}
      extraTabs={[
        { value: 'registration', label: 'Registration', content: <GiftShopRegistrations /> },
        { value: 'signin', label: 'Check-In & Status', content: <GiftShopSignIn /> },
        { value: 'preregistration', label: 'Pre-registration links', content: <GiftShopPreRegistration /> },
        { value: 'archive', label: 'Event archive', content: <GiftShopEventArchiveTab /> },
      ]}
    />
  );
}