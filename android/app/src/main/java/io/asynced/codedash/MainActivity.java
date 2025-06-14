package io.asynced.codedash;

import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Questo codice rende la barra di stato trasparente e permette all'app
    // di disegnarsi "sotto" di essa, andando a schermo intero.
    Window window = getWindow();
    window.setStatusBarColor(Color.TRANSPARENT);
    window.getDecorView().setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
        View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    );
  }
}
