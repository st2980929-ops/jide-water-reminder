import Capacitor
import UIKit
import WebKit

class WaterBridgeController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        let background = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 20/255, green: 29/255, blue: 27/255, alpha: 1)
                : UIColor(red: 246/255, green: 247/255, blue: 243/255, alpha: 1)
        }
        view.backgroundColor = background
        webView?.backgroundColor = background
        webView?.scrollView.backgroundColor = background
        bridge?.registerPluginInstance(WaterNotificationsPlugin())
    }
}
