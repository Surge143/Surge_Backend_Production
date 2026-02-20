import { Admins } from "./Users/Admins";
import { AppCategories } from "./AppCategories/AppCategories";
import { AppSubCategories } from "./AppCategories/AppSubCategories";
import { AppOrders } from "./AppOrders/AppOrders";
import { AppCart } from "./AppCart/AppCart";
import { Coupon } from "./Coupon/Coupon";
import { CustomizationTemplate } from "./AppCategories/CustomizationTemplate";
import { Media } from "./Media";
import { Menu } from "./Menu/Menu";
import { Otp } from "./Otp/Otp";
import { Shop } from "./Shop/Shop";
import { ShopCoupons } from "./ShopCoupons/ShopCoupons";
import { ShopMenu } from "./ShopMenu/ShopMenu";
import { WebCategories } from "./WebCategories/WebCategories";
import { WebSubCategories } from "./WebCategories/WebSubCategories";
import { AppWishlist } from './AppWishlist/AppWishlist'
import { Users } from "./Users/Users";
import { WebProducts } from "./WebProducts/WebProducts";
import { WebCart } from "./WebCart/WebCart";
import { WTCoins } from "./WTCoins/WTCoins";
import { UserWTCoins } from "./UserWTCoins/UserWTCoins";
import { WebOrders } from "./WebOrders/WebOrders";
import { Slots } from "./Slots/Slots";
import { ShipAndTax } from "./ShipAndTax/ShipAndTax";
import { WebSubscription } from "./WebSubscription/WebSubscription";
import { WebWishlist } from "./WebWishlist/WebWishlist";
import { WTStamps } from "./WTStamps/WTStamps";
import { UserPreferences } from "./UserPreferences/UserPreferences";
import { StampRewardProducts } from "./StampRewardProducts/StampRewardProducts";

export const collections = [
    Users,
    Admins,
    AppCategories,
    Media,
    AppSubCategories,
    CustomizationTemplate,
    Menu,
    Shop,
    ShopMenu,
    Coupon,
    ShopCoupons,
    Otp,
    AppCart,
    AppWishlist,
    AppOrders,
    WebCategories,
    WebSubCategories,
    WebProducts,
    WebCart,
    UserWTCoins,
    WebOrders,
    Slots,
    WebSubscription,
    WebWishlist,
    WTStamps,
    UserPreferences,
]

export const globals = [
    WTCoins,
    ShipAndTax,
    StampRewardProducts
]