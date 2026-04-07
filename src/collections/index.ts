import { Admins } from './Users/Admins'
import { AppCategories } from './AppCategories/AppCategories'
import { AppSubCategories } from './AppCategories/AppSubCategories'
import { AppOrders } from './AppOrders/AppOrders'
import { AppCart } from './AppCart/AppCart'
import { Coupon } from './Coupon/Coupon'
import { CustomizationTemplate } from './AppCategories/CustomizationTemplate'
import { Media } from './Media'
import { Menu } from './Menu/Menu'
import { Otp } from './Otp/Otp'
import { Shop } from './Shop/Shop'
import { ShopCoupons } from './ShopCoupons/ShopCoupons'
import { ShopMenu } from './ShopMenu/ShopMenu'
import { WebCategories } from './WebCategories/WebCategories'
import { WebSubCategories } from './WebCategories/WebSubCategories'
import { Wishlist } from './Wishlist/Wishlist'
import { Users } from './Users/Users'
import { WebProducts } from './WebProducts/WebProducts'
import { WebCart } from './WebCart/WebCart'
import { WTCoins } from './WTCoins/WTCoins'
import { UserWTCoins } from './UserWTCoins/UserWTCoins'
import { WebOrders } from './WebOrders/WebOrders'
import { Slots } from './Slots/Slots'
import { ShipAndTax } from './ShipAndTax/ShipAndTax'
import { WTStamps } from './WTStamps/WTStamps'
import { UserPreferences } from './UserPreferences/UserPreferences'
import { AppContactForm } from './AppContactForm/AppContactForm'
import { WebContactForm } from './WebContactForm/WebContactForm'
import { Notifications } from './Notifications/Notifications'
import { AppBestSeller } from './AppBestSeller/AppBestSeller'
import { Blogs } from './Blogs/Blogs'
import { Wholesale } from './Wholesale/Wholesale'
import { AppBanners } from './AppBanner/AppBanner'
import { Newsletter } from './Newsletter/Newsletter'

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
  Wishlist,
  AppOrders,
  WebCategories,
  WebSubCategories,
  WebProducts,
  WebCart,
  UserWTCoins,
  WebOrders,
  Slots,
  WTStamps,
  UserPreferences,
  AppContactForm,
  WebContactForm,
  Notifications,
  AppBestSeller,
  Blogs,
  Wholesale,
  AppBanners,
  Newsletter,
]

export const globals = [WTCoins, ShipAndTax]
