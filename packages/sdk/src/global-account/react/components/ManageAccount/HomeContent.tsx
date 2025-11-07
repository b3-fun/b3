import { Tabs, TabsContent, TabsList, TabTrigger } from "../ui/Tabs";
import { Header } from "./Header";
import HomeActions from "./HomeActions";
import NFTContent from "./NFTContent";
import ProfileSection from "./ProfileSection";
import TokenContent from "./TokenContent";

interface HomeContentProps {
  showDeposit?: boolean;
  showSwap?: boolean;
}

export function HomeContent({ showDeposit = false, showSwap = true }: HomeContentProps) {
  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex flex-col gap-6 p-6">
        <ProfileSection />

        <HomeActions showDeposit={showDeposit} showSwap={showSwap} />
        <div className="space-y-2">
          <Tabs defaultValue={"tokens"}>
            <TabsList>
              <TabTrigger value="tokens">Tokens</TabTrigger>
              <TabTrigger value="nfts">NFTs</TabTrigger>
            </TabsList>
            <TabsContent value="tokens" className="px-0 pb-4 pt-2">
              <TokenContent />
            </TabsContent>
            <TabsContent value="nfts" className="px-0 pb-4 pt-2">
              <NFTContent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
